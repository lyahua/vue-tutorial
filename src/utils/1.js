console.log('1111')

const fs = require('fs');

const content = 'Some content!1111111111111111111';

fs.writeFile('./1.txt', content, err => {
  if (err) {
    console.error(err);
  }
  // file written successfully
});

var rs=  fs.readFileSync('./1.txt')
console.log('rs',rs.toString())