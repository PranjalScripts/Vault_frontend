const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chooseComputerMove, calculateWinner } = require('./helpers/loadTypeScript.cjs')(path.join(__dirname, '../src/features/ticTacToe'))('ai');
const threat = ['X','X',null,null,'O',null,null,null,null];
test('all levels block when playing optimally and can miss a block when making a mistake', () => {
  for (const level of ['basic','medium','hard']) {
    assert.equal(chooseComputerMove(threat,level,()=>.99),2);
    assert.notEqual(chooseComputerMove(threat,level,()=>0),2);
  }
  assert.deepEqual(threat,['X','X',null,null,'O',null,null,null,null]);
});
test('mistakes decrease strictly across levels on the same board', () => {
  const counts = ['basic','medium','hard'].map(level => {
    let misses=0;
    for(let i=0;i<100;i++) {let calls=0;const move=chooseComputerMove(threat,level,()=>calls++===0?(i+.5)/100:0);if(move!==2)misses++;}
    return misses;
  });
  assert.deepEqual(counts,[65,25,5]);
});
test('computer takes available wins on optimal turns and never moves after game over', () => {
  const board=['O','O',null,'X','X',null,'X',null,null];
  assert.equal(chooseComputerMove(board,'hard',()=>.99),2);
  board[2]='O'; assert.equal(calculateWinner(board),'O');
  assert.equal(chooseComputerMove(board,'basic'),-1);
  assert.equal(chooseComputerMove(['X','O','X','X','O','O','O','X','X'],'hard'),-1);
});
test('the human can win repeatedly at every level by exploiting a missed block', () => {
  for(const level of ['basic','medium','hard'])for(let i=0;i<5;i++){
    const board=[...threat];board[chooseComputerMove(board,level,()=>0)]='O';board[2]='X';
    assert.equal(calculateWinner(board),'X');
  }
});
