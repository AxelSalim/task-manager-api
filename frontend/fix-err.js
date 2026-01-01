const fs = require('fs');
const path = require('path');

const files = [
  'src/components/finance/NewFinanceTransactionSheet.tsx',
  'src/components/finance/NewFinanceCategorySheet.tsx',
];

files.forEach((file) => {
  const fullPath = path.join(__dirname, file);
  let s = fs.readFileSync(fullPath, 'utf8');
  // Match any apostrophe (ASCII or Unicode) between l and enregistrement
  s = s.replace(
    /description: getErrorMessage\(error, 'Échec de l['']enregistrement',/g,
    "description: getErrorMessage(error, \"Échec de l'enregistrement\"),"
  );
  fs.writeFileSync(fullPath, s);
  console.log('Fixed:', file);
});
