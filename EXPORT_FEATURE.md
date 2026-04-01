# Export Feature Documentation

## Overview
The Dexi platform now includes comprehensive export functionality for transaction history and trading data. Users can export their data in both CSV and JSON formats.

## Features

### 1. Wallet Transaction Export
Export all wallet transactions including deposits, withdrawals, trades, and other ledger entries.

**Endpoints:**
- CSV: `GET /wallet/:userId/export/csv`
- JSON: `GET /wallet/:userId/export/json`

**Data Included:**
- Transaction date and time
- Transaction type (DEPOSIT, WITHDRAWAL, TRADE_SPOT, TRADE_BINARY, etc.)
- Currency
- Amount
- Reference ID
- Current balances (JSON only)

**Frontend Location:** Wallet page (`/dashboard/wallet`)

---

### 2. Binary Options Export
Export all binary options positions including active, won, and lost trades.

**Endpoints:**
- CSV: `GET /binary/export/:userId/csv`
- JSON: `GET /binary/export/:userId/json`

**Data Included:**
- Position date and time
- Trading pair
- Side (CALL/PUT)
- Investment amount
- Entry price
- Strike price
- Duration
- Status (OPEN, WON, LOST, DRAW)
- Payout amount
- Profit/Loss

**Frontend Location:** Binary Options page (`/dashboard/binary`)

---

### 3. Spot Trading Export
Export all spot trading orders and their execution details.

**Endpoints:**
- CSV: `GET /spot/export/:userId/csv`
- JSON: `GET /spot/export/:userId/json`

**Data Included:**
- Order date and time
- Trading pair
- Side (BUY/SELL)
- Order type (LIMIT/MARKET)
- Amount
- Price
- Filled amount
- Remaining amount
- Order status
- Trade executions (JSON only)

**Frontend Location:** Spot Trading page (`/dashboard/spot`)

---

## Usage

### From the Frontend

1. **Wallet Page:**
   - Navigate to `/dashboard/wallet`
   - Click "Export CSV" or "Export JSON" button in the Transaction History section
   - File will download automatically

2. **Binary Options Page:**
   - Navigate to `/dashboard/binary`
   - Click "CSV" or "JSON" button in the Active Positions section
   - File will download automatically

3. **Spot Trading Page:**
   - Navigate to `/dashboard/spot`
   - Click "CSV" or "JSON" button in the Order Book section
   - File will download automatically

### Direct API Access

You can also access the export endpoints directly:

```bash
# Wallet transactions CSV
curl http://localhost:3001/wallet/{userId}/export/csv -o transactions.csv

# Wallet transactions JSON
curl http://localhost:3001/wallet/{userId}/export/json -o transactions.json

# Binary positions CSV
curl http://localhost:3001/binary/export/{userId}/csv -o binary_positions.csv

# Binary positions JSON
curl http://localhost:3001/binary/export/{userId}/json -o binary_positions.json

# Spot orders CSV
curl http://localhost:3001/spot/export/{userId}/csv -o spot_orders.csv

# Spot orders JSON
curl http://localhost:3001/spot/export/{userId}/json -o spot_orders.json
```

---

## File Formats

### CSV Format
- Simple comma-separated values
- Headers included in first row
- All values quoted for safety
- Compatible with Excel, Google Sheets, and other spreadsheet applications
- Filename format: `{type}_{userId}_{timestamp}.csv`

### JSON Format
- Structured JSON with metadata
- Includes export date and user ID
- Nested data for complex relationships
- Pretty-printed with 2-space indentation
- Filename format: `{type}_{userId}_{timestamp}.json`

---

## Example Outputs

### Wallet CSV Example
```csv
"Date","Type","Currency","Amount","Reference ID"
"2026-01-21T03:30:00.000Z","DEPOSIT","USDT","1000","DEP-1737432600000"
"2026-01-21T03:35:00.000Z","TRADE_BINARY","USDT","-100","TRADE-abc123"
```

### Wallet JSON Example
```json
{
  "userId": "user123",
  "exportDate": "2026-01-21T03:40:00.000Z",
  "currentBalances": {
    "USDT": {
      "available": 900,
      "locked": 0
    }
  },
  "transactions": [
    {
      "id": "tx123",
      "date": "2026-01-21T03:30:00.000Z",
      "type": "DEPOSIT",
      "currency": "USDT",
      "amount": 1000,
      "referenceId": "DEP-1737432600000"
    }
  ]
}
```

---

## Security Considerations

1. **Authentication:** In production, ensure all export endpoints are protected with JWT authentication
2. **Authorization:** Verify that users can only export their own data
3. **Rate Limiting:** Consider implementing rate limits to prevent abuse
4. **Data Privacy:** Ensure exported files are transmitted over HTTPS
5. **Audit Logging:** Log all export requests for compliance and security monitoring

---

## Future Enhancements

- [ ] Add date range filtering for exports
- [ ] Support for PDF export format
- [ ] Email delivery of export files
- [ ] Scheduled automatic exports
- [ ] Export templates for tax reporting
- [ ] Bulk export for all data types
- [ ] Export encryption for sensitive data

---

## Technical Implementation

### Backend
- **Framework:** NestJS
- **Controllers:** WalletController, BinaryController, SpotController
- **Services:** WalletService, BinaryService, SpotService
- **Response Type:** File download with appropriate headers

### Frontend
- **Framework:** Next.js (React)
- **Method:** Direct URL opening in new tab/window
- **UI:** Export buttons integrated into existing pages

---

## Troubleshooting

**Issue:** Export button doesn't work
- **Solution:** Ensure you're logged in and the backend server is running

**Issue:** CSV file shows garbled characters
- **Solution:** Open with UTF-8 encoding in your spreadsheet application

**Issue:** JSON file won't download
- **Solution:** Check browser console for errors and verify API URL is correct

**Issue:** Empty export file
- **Solution:** Ensure you have transaction/trading history to export

---

## Support

For issues or questions about the export feature, please contact the development team or create an issue in the project repository.
