Add a wholesaler with reliable catalog sync and API order execution.
1. Fill `supplier_registry.template.json` for new supplier.
2. Create supplier credentials in secrets store (no plain-text keys in git).
3. Fill `sku_mapping.template.json` for initial product set.
4. Validate connector contract against `connector_contract.v1.json`.
5. Run sandbox order flow:
- customer order -> supplier order -> tracking update -> customer shipment.
6. Promote supplier status from `draft` to `active` only after test success.