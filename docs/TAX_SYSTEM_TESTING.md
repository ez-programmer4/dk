# Tax System Testing Guide

## How Test Data Represents System Functionality

### What Test Data Creates

When you click "Create Test Data", the system creates **5 sample tax transactions** that simulate real Stripe Tax calculations:

1. **Different Jurisdictions**:

   - US-CA (California) - Los Angeles
   - US-NY (New York) - New York
   - US-TX (Texas) - Austin
   - CA-ON (Canada, Ontario) - Toronto
   - GB (United Kingdom) - London

2. **Different Currencies**:

   - USD (US Dollar)
   - CAD (Canadian Dollar)
   - GBP (British Pound)

3. **Realistic Tax Calculations**:

   - Base amounts: Random between $20-$120
   - Tax rates: Random between 8%-13% (realistic sales tax rates)
   - Tax amounts: Calculated as `baseAmount × taxRate`
   - Total amounts: `baseAmount + taxAmount`

4. **Complete Tax Breakdown**:
   - Each transaction includes detailed tax breakdown JSON
   - Jurisdiction information
   - Tax type (sales_tax)
   - Tax rate percentage
   - Taxable amount
   - Tax amount

### How to Verify System is Working

#### 1. **Check Summary Dashboard**

After creating test data, you should see:

- **Total Tax Absorbed**: Sum of all tax amounts (should be > $0)
- **Total Transactions**: Should show 5
- **Average Tax**: Average tax per transaction
- **Jurisdictions**: Should show 5 different jurisdictions

#### 2. **Check Tax by Jurisdiction Chart**

- Bar chart showing tax amounts for each jurisdiction
- Should display: US-CA, US-NY, US-TX, CA-ON, GB
- Each bar represents the total tax for that jurisdiction

#### 3. **Check Tax by Currency Pie Chart**

- Pie chart showing tax distribution by currency
- Should show slices for USD, CAD, GBP
- Each slice represents total tax in that currency

#### 4. **Check Jurisdiction Table**

- Table listing all jurisdictions
- Shows:
  - Jurisdiction code (e.g., "US-CA")
  - Country
  - State (if applicable)
  - Total tax amount
  - Number of transactions

#### 5. **Check Detailed Transactions**

Switch to "Detailed Transactions" view:

- Should see 5 transactions listed
- Each transaction shows:
  - Invoice ID (test invoice IDs)
  - Student name
  - Package name
  - Base amount (what student paid)
  - Tax amount (what business absorbed)
  - Total amount (base + tax)
  - Location (city, state)
  - Date

### What This Proves

✅ **Database Integration**: Tax transactions are stored correctly
✅ **Data Aggregation**: Summary calculations work (totals, averages)
✅ **Grouping**: Data groups correctly by jurisdiction and currency
✅ **Filtering**: Date range and other filters work
✅ **Display**: Charts and tables render correctly
✅ **Export**: CSV/JSON export functionality works

### Real-World Flow

The test data simulates what happens when:

1. **Student subscribes** → Checkout collects billing address
2. **Stripe calculates tax** → Based on billing address and product tax code
3. **Payment succeeds** → Invoice includes tax breakdown
4. **Webhook processes** → Tax data extracted and stored
5. **Admin views reports** → Tax data displayed in dashboard

### Next Steps for Production

Once test data confirms everything works:

1. **Configure Stripe Tax**:

   - Set origin address in Stripe Dashboard
   - Enable automatic tax calculation

2. **Real Transactions**:

   - When students subscribe, Stripe will calculate tax
   - Webhook will automatically store tax data
   - Reports will show real tax amounts

3. **Monitor**:
   - Check tax reports regularly
   - Verify tax amounts match Stripe invoices
   - Export reports for accounting

### Troubleshooting

**If test data doesn't appear:**

1. Check browser console for errors
2. Check server logs for query errors
3. Verify database migration ran successfully
4. Check date range includes today
5. Click "Reset Date Range" button
6. Click "Refresh" button

**If charts are empty:**

1. Make sure you're on "Summary" report type
2. Check that summary array has data (console log)
3. Verify byJurisdiction array has data

**If export doesn't work:**

1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check network tab for failed requests
