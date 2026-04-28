export function getProfileCompleteness(profile) {
  if (!profile) return 0;

  const fields = [
    { key: 'first_name', weight: 1 },
    { key: 'last_name', weight: 1 },
    { key: 'phone_il', weight: 1 },
    { key: 'business_name', weight: 1 },
    { key: 'business_type', weight: 1 },
    { key: 'city', weight: 1 },
    { key: 'email', weight: 1 },
    { key: 'id_number_il', weight: 1 },
    { key: 'bank_name', weight: 1 },
    { key: 'vat_number', weight: 1 },
    { key: 'tax_file_number', weight: 1 },
    { key: 'nii_number', weight: 1 },
    { key: 'gender', weight: 1 },
    { key: 'birth_date', weight: 1 },
    { key: 'estimated_annual_revenue', weight: 1 },
  ];

  const totalWeight = fields.length;
  const filledWeight = fields
    .filter(f => {
      const val = profile[f.key];
      return val !== null && val !== undefined && val.toString().trim() !== '';
    })
    .reduce((sum, f) => sum + f.weight, 0);

  return Math.round((filledWeight / totalWeight) * 100);
}