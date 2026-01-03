import { prisma } from "@/lib/prisma";

export interface ZoomMeetingConfig {
  topic: string;
  type: 1 | 2; // 1 = Instant meeting, 2 = Scheduled meeting
  start_time: string; // ISO 8601 format
  duration: number; // in minutes
  timezone: string;
  agenda?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    watermark?: boolean;
    use_pmi?: boolean;
    approval_type?: number;
    audio?: string;
    auto_recording?: string;
    waiting_room?: boolean;
  };
}

export interface ZoomMeeting {
  id: string;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  start_url: string;
  join_url: string;
}

export class ZoomService {
  private static ZOOM_API_BASE = "https://api.zoom.us/v2";

  /**
   * Get Server-to-Server OAuth access token
   * No user authorization needed - uses account credentials
   * Token is valid for 1 hour and cached
   */
  private static s2sTokenCache: { token: string; expiresAt: number } | null = null;

  static async getServerToServerToken(): Promise<string> {
    // Check cache first
    if (this.s2sTokenCache && this.s2sTokenCache.expiresAt > Date.now()) {
      return this.s2sTokenCache.token;
    }

    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!accountId || !clientId || !clientSecret) {
      throw new Error(
        "Server-to-Server OAuth not configured. Missing: " +
        (!accountId ? "ZOOM_ACCOUNT_ID " : "") +
        (!clientId ? "ZOOM_CLIENT_ID " : "") +
        (!clientSecret ? "ZOOM_CLIENT_SECRET" : "")
      );
    }

    console.log("🔑 Getting Server-to-Server OAuth token...");

    const response = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString("base64")}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Server-to-Server OAuth failed:", errorText);
      throw new Error(`Failed to get Server-to-Server token: ${errorText}`);
    }

    const data = await response.json();
    
    // Cache token (expires in 1 hour, cache for 50 minutes to be safe)
    this.s2sTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + 50 * 60 * 1000,
    };

    console.log("✅ Server-to-Server OAuth token obtained");
    return data.access_token;
  }

  /**
   * Refresh access token if expired (LEGACY - for General OAuth)
   * This is kept for backwards compatibility but not used with Server-to-Server
   */
  static async refreshAccessToken(teacherId: string): Promise<string> {
    const teacher = await prisma.wpos_wpdatatable_24.findUnique({
      where: { ustazid: teacherId },
      select: {
        zoom_refresh_token: true,
        zoom_token_expires_at: true,
        zoom_access_token: true,
      },
    });

    if (!teacher?.zoom_refresh_token) {
      throw new Error("Teacher Zoom account not connected");
    }

    // Check if token is still valid (with 5 min buffer)
    const now = new Date();
    const expiresAt = teacher.zoom_token_expires_at;
    if (expiresAt && expiresAt > new Date(now.getTime() + 5 * 60 * 1000)) {
      return teacher.zoom_access_token!;
    }

    // Refresh the token with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch("https://zoom.us/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: teacher.zoom_refresh_token,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        console.error("❌ Zoom token refresh failed:", error);

        // Check for specific error types
        if (error.includes("invalid_grant")) {
          throw new Error(
            "Zoom account disconnected - please reconnect your Zoom account"
          );
        }

        throw new Error(`Failed to refresh Zoom token: ${error}`);
      }

      const data = await response.json();

      // Update tokens in database
      const newExpiresAt = new Date(Date.now() + data.expires_in * 1000);
      await prisma.wpos_wpdatatable_24.update({
        where: { ustazid: teacherId },
        data: {
          zoom_access_token: data.access_token,
          zoom_refresh_token: data.refresh_token || teacher.zoom_refresh_token,
          zoom_token_expires_at: newExpiresAt,
        },
      });

      return data.access_token;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Zoom token refresh timed out - please try again");
      }
      throw error;
    }
  }

  /**
   * Get teacher's Zoom user info
   */
  static async getZoomUser(accessToken: string) {
    const response = await fetch(`${this.ZOOM_API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Zoom user info");
    }

    return response.json();
  }

  /**
   * Create meeting using Server-to-Server OAuth
   * Works for ALL teachers without individual Zoom connections
   * Meetings created under the system Zoom account
   */
  static async createMeetingServerToServer(
    teacherName: string,
    studentName: string,
    startTime?: Date,
    config?: Partial<ZoomMeetingConfig>
  ): Promise<ZoomMeeting> {
    const accessToken = await this.getServerToServerToken();
    
    const meetingTime = startTime || new Date(Date.now() + 5 * 60 * 1000);

    console.log(`🎬 Creating meeting: ${teacherName} - ${studentName}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(
        `${this.ZOOM_API_BASE}/users/me/meetings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: `${teacherName} - ${studentName}`,
            type: config?.type || 1, // Default: Instant meeting
            start_time: meetingTime.toISOString(),
            duration: config?.duration || 60,
            timezone: config?.timezone || "Africa/Addis_Ababa",
            agenda: config?.agenda,
            settings: {
              host_video: false,
              participant_video: false,
              join_before_host: true,
              mute_upon_entry: false,
              auto_recording: "none",
              waiting_room: false,
              ...config?.settings,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Meeting creation failed:", error);
        throw new Error(
          `Failed to create Zoom meeting: ${
            error.message || response.statusText
          }`
        );
      }

      const meeting = await response.json();
      console.log(`✅ Meeting created: ${meeting.id}`);
      return meeting;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Zoom meeting creation timed out - please try again");
      }
      throw error;
    }
  }

  /**
   * Create a scheduled Zoom meeting (LEGACY - for General OAuth)
   * Kept for backwards compatibility
   */
  static async createMeeting(
    teacherId: string,
    config: ZoomMeetingConfig
  ): Promise<ZoomMeeting> {
    const accessToken = await this.refreshAccessToken(teacherId);

    const teacher = await prisma.wpos_wpdatatable_24.findUnique({
      where: { ustazid: teacherId },
      select: { zoom_user_id: true },
    });

    if (!teacher?.zoom_user_id) {
      throw new Error("Teacher Zoom user ID not found");
    }

    // Create meeting with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(
        `${this.ZOOM_API_BASE}/users/${teacher.zoom_user_id}/meetings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(config),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to create Zoom meeting: ${
            error.message || response.statusText
          }`
        );
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Zoom meeting creation timed out - please try again");
      }
      throw error;
    }
  }

  /**
   * Get meeting details
   */
  static async getMeeting(teacherId: string, meetingId: string): Promise<any> {
    const accessToken = await this.refreshAccessToken(teacherId);

    const response = await fetch(
      `${this.ZOOM_API_BASE}/meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch meeting details");
    }

    return response.json();
  }

  /**
   * Delete a meeting
   */
  static async deleteMeeting(
    teacherId: string,
    meetingId: string
  ): Promise<void> {
    const accessToken = await this.refreshAccessToken(teacherId);

    const response = await fetch(
      `${this.ZOOM_API_BASE}/meetings/${meetingId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 204) {
      throw new Error("Failed to delete meeting");
    }
  }

  /**
   * Get past meeting details (for duration tracking)
   */
  static async getPastMeetingDetails(
    teacherId: string,
    meetingId: string
  ): Promise<any> {
    const accessToken = await this.refreshAccessToken(teacherId);

    const response = await fetch(
      `${this.ZOOM_API_BASE}/past_meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch past meeting details");
    }

    return response.json();
  }

  /**
   * Check if teacher has Zoom connected
   */
  static async isZoomConnected(teacherId: string): Promise<boolean> {
    const teacher = await prisma.wpos_wpdatatable_24.findUnique({
      where: { ustazid: teacherId },
      select: {
        zoom_access_token: true,
        zoom_refresh_token: true,
        zoom_token_expires_at: true,
      },
    });

    if (!teacher?.zoom_access_token || !teacher?.zoom_refresh_token) {
      return false;
    }

    // Check if refresh token is expired (Zoom refresh tokens expire after 90 days of inactivity)
    // If access token is expired but refresh token exists, we can refresh it
    return true;
  }

  /**
   * Disconnect Zoom account
   */
  static async disconnectZoom(teacherId: string): Promise<void> {
    await prisma.wpos_wpdatatable_24.update({
      where: { ustazid: teacherId },
      data: {
        zoom_user_id: null,
        zoom_access_token: null,
        zoom_refresh_token: null,
        zoom_token_expires_at: null,
        zoom_connected_at: null,
      },
    });
  }
}
