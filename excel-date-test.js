// Test Excel date conversion to fix timezone issues
// Run with: node excel-date-test.js

console.log('🧪 Testing Excel Date Conversion');
console.log('=================================');

// Test cases for Excel serial numbers
const testCases = [
    { excel: 45566, expected: '1/10/2025' }, // October 1, 2025
    { excel: 45565, expected: '30/09/2025' }, // September 30, 2025
    { excel: 44927, expected: '1/1/2023' },  // January 1, 2023
    { excel: 45292, expected: '1/1/2024' },  // January 1, 2024
    { excel: 44197, expected: '1/1/2021' },  // January 1, 2021
];

console.log('\n📅 Testing different Excel date conversion methods:\n');

testCases.forEach(testCase => {
    console.log(`Excel Serial: ${testCase.excel} (Expected: ${testCase.expected})`);
    
    // Old method (problematic)
    const oldMethod = new Date((testCase.excel - 25569) * 86400 * 1000);
    const oldResult = oldMethod.toLocaleDateString('vi-VN');
    const oldISO = oldMethod.toISOString().split('T')[0];
    
    // New method (fixed)
    const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
    const daysSinceEpoch = testCase.excel - 1; // Excel's day 1 is actually day 2 (off by 1)
    const newMethod = new Date(excelEpoch.getTime() + (daysSinceEpoch * 24 * 60 * 60 * 1000));
    const newResult = newMethod.toLocaleDateString('vi-VN');
    
    // Format as YYYY-MM-DD in local timezone
    const year = newMethod.getFullYear();
    const month = String(newMethod.getMonth() + 1).padStart(2, '0');
    const day = String(newMethod.getDate()).padStart(2, '0');
    const newISO = `${year}-${month}-${day}`;
    
    console.log(`  Old Method: ${oldResult} (ISO: ${oldISO})`);
    console.log(`  New Method: ${newResult} (ISO: ${newISO})`);
    console.log(`  Match Expected: ${newResult === testCase.expected ? '✅' : '❌'}`);
    console.log('');
});

console.log('📊 Summary:');
console.log('Old method uses UTC conversion which can cause timezone shifts');
console.log('New method uses local timezone to prevent date shifting');
console.log('This should fix the issue where 1/10/2025 becomes 30/09/2025');
