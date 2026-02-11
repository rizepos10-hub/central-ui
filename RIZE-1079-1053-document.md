# Frontend Developer Proposal
## RIZE-1053 & RIZE-1079 — Payment Method Settings, Order Model Updates & Service Charges

---

## 1. Payment Method Settings Dashboard (RIZE-1053)

### Overview

A new settings dashboard is needed where users can manage **Payment Method Settings** — named configurations that wrap the underlying `TransactionMethod` enum.

---

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/payment-method-settings/all` | `VIEW_BUSINESS_SETTINGS` | Fetch all settings (no pagination, max ~20 records) |
| `GET` | `/api/payment-method-settings` | `VIEW_BUSINESS_SETTINGS` | Fetch paginated settings |
| `GET` | `/api/payment-method-settings/{id}` | `VIEW_BUSINESS_SETTINGS` | Fetch single setting by ID |
| `POST` | `/api/payment-method-settings` | `EDIT_BUSINESS_SETTINGS` | Create new setting |
| `PUT` | `/api/payment-method-settings/{id}` | `EDIT_BUSINESS_SETTINGS` | Update existing setting |
| `DELETE` | `/api/payment-method-settings/{id}` | `DELETE_BUSINESS_SETTINGS` | Delete a setting |

---

### Data Model — `PaymentMethodSettingDTO`

```json
{
  "id": "string",
  "transactionMethod": "cash | debit | loyalty | storeCredit | visa | master | amex | giftCard | coupon | creditCard | chinaUnionPay | discover | japanCreditBureau | electronicBenefitTransferCashBenefit | electronicBenefitTransferFoodStamp | custom | convergeLightbox",
  "name": "string",
  "show": true
}
```

**Field notes:**
- `transactionMethod` — the underlying enum type this setting is associated with (read-only context, not editable by the user directly).
- `name` — a human-readable display name for this method (editable).
- `show` — boolean toggle controlling whether this method is visible to end-users.

---

### UI Constraints

**Add / Delete:**
- The user can **only** add or delete settings where `transactionMethod === "custom"`.
- For all other `transactionMethod` values (e.g. `cash`, `visa`, `debit`, etc.), the add and delete actions must be **disabled/hidden**.

**Edit (all methods):**
- The user **can** edit `name` and `show` for **any** payment method setting, regardless of `transactionMethod` type.

**Name change warning:**
- When the user attempts to update the `name` field of **any** setting, display a warning before saving:

> ⚠️ Changing the name of this payment method will affect its record in reports. Transactions previously recorded under the old name will appear as a separate entry from transactions recorded under the new name.

This warning should appear as a confirmation dialog/prompt before the `PUT` request is made.

---

## 2. Order Model Updates (RIZE-1053)

### Overview

The `transactionMethod` field in the order's payment transaction is **no longer an enum** — it is now a full `PaymentMethodSettingDTO` object.

---

### Updated Data Model — `PaymentTransactionDTO`

The relevant field change:

**Before:**
```json
{
  "method": "cash"
}
```

**After:**
```json
{
  "method": {
    "id": "string",
    "transactionMethod": "cash",
    "name": "Cash",
    "show": true
  }
}
```

Full `PaymentTransactionDTO` shape for reference:

```json
{
  "id": "string",
  "amount": 0.0,
  "receivedAmount": 0.0,
  ...
  "method": {
    "id": "string",
    "transactionMethod": "cash | debit | custom | ...",
    "name": "string",
    "show": true
  },
  ...
}
```

---

### Display Fix

In both the **Business Administration** and **Online Ordering** order view pages:

- Navigate to: Order → Bills → Payment Transactions
- The payment method was previously rendered as `Object (Object)` due to the type change.
- It must now display **`method.name`** instead.

---

## 3. Service Charges Updates (RIZE-1079)

### Overview

In the Service Charges business UI, the user currently selects from `TransactionMethod` enum values. This must be replaced with a selection from **Payment Method Settings**.

---

### Data Path

```
serviceCharge.setting.applicableOn.transactionMethods
```

This field is a **set/array of `PaymentMethodSetting` objects** (not enum strings).

---

### Data Model — `ApplyOn` (relevant excerpt)

**Before (enum-based):**
```json
{
  "transactionMethods": ["cash", "visa", "custom"]
}
```

**After (object-based):**
```json
{
  "transactionMethods": [
    {
      "id": "string",
      "transactionMethod": "cash",
      "name": "Cash",
      "show": true
    },
    {
      "id": "string",
      "transactionMethod": "visa",
      "name": "Visa",
      "show": true
    }
  ]
}
```

---

### Fetching & Filtering

- Use: `GET /api/payment-method-settings/all`
- The dataset is small (max ~20 records), so no pagination is needed.
- **Frontend filter:** Show only settings where `show === true` in the selection UI.
- Allow multi-select — the user picks one or more payment method settings to associate with the service charge.

---

### Summary of `TransactionMethod` Enum Values (for reference)

```
cash, debit, loyalty, storeCredit, visa, master, amex, giftCard,
coupon, creditCard, chinaUnionPay, discover, japanCreditBureau,
electronicBenefitTransferCashBenefit, electronicBenefitTransferFoodStamp,
custom, convergeLightbox
```

Only settings with `transactionMethod === "custom"` are user-creatable/deletable.

---
