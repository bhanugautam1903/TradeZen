const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  '"Duplicate hashtags detected on rapid interval nodes",',
  '"Repeated promotional language",'
);
code = code.replace(
  '"Template phrase replication \'Buy now, to the moon\'",',
  '"Coordinated message similarity",'
);
code = code.replace(
  '"Anonymous newly registered handle networks"',
  '"Abnormal engagement patterns"'
);

fs.writeFileSync('server.ts', code);
console.log('Fixed server');
