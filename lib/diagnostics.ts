/**
 * Diagnostic utilities to help debug contract issues
 */

export function analyzePoolABI() {
  const PoolABI = require('./Pool.json');
  
  const functions = PoolABI.filter((item: any) => item.type === 'function');
  const viewFunctions = functions.filter((f: any) => 
    f.stateMutability === 'view' || f.stateMutability === 'pure'
  );
  const stateFunctions = functions.filter((f: any) => 
    f.stateMutability !== 'view' && f.stateMutability !== 'pure'
  );
  
  console.log('=== POOL ABI ANALYSIS ===');
  console.log('Total functions:', functions.length);
  console.log('View/Pure functions:', viewFunctions.length);
  console.log('State-changing functions:', stateFunctions.length);
  
  console.log('\nView functions:');
  viewFunctions.forEach((f: any) => {
    console.log(`  - ${f.name}()`);
  });
  
  console.log('\nState-changing functions:');
  if (stateFunctions.length === 0) {
    console.error('  ❌ NONE FOUND! This is the problem!');
    console.error('  The Pool ABI is incomplete.');
    console.error('  Missing critical functions: mint(), burn(), swap()');
  } else {
    stateFunctions.forEach((f: any) => {
      console.log(`  - ${f.name}()`);
    });
  }
  
  // Check for specific required functions
  const requiredFunctions = ['mint', 'burn', 'swap', 'initialize'];
  console.log('\nChecking for required functions:');
  requiredFunctions.forEach(funcName => {
    const found = functions.some((f: any) => f.name === funcName);
    console.log(`  ${found ? '✅' : '❌'} ${funcName}()`);
  });
  
  return {
    total: functions.length,
    hasStateFunctions: stateFunctions.length > 0,
    missingMint: !functions.some((f: any) => f.name === 'mint'),
  };
}

