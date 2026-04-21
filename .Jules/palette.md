## 2024-05-18 - Added ARIA labels to Icon-only Buttons
**Learning:** Found multiple icon-only buttons missing `aria-label`s, such as the close modal buttons in `ConvertModal.tsx` and `TransferModal.tsx` as well as interactive elements in the `page.tsx` of the dashboard.
**Action:** Always add `aria-label` to buttons that only contain an icon to ensure screen reader users can identify their purpose.
