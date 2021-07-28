const { spawn, exec } = require('child_process');
const ls = spawn('/bin/bash', [], {
  shell: false,
  env: { ANSWER: 42 }
});
let r = 0;
ls.stdout.on('data', (data) => {
  console.log(ls.env);
  console.log(`stdout: ${data}`); 
});
ls.on('close', (code) => {
  console.log(`child process close all stdio with code ${code}`);
});

ls.on('error', (code) => {
  console.log(code);
  console.log(`child process error with message ${code}`);
});
ls.on('exit', (code) => {
  console.log(`child process exited with code ${code}`);
});   
ls.stdin.setEncoding('utf8');
ls.stdin.write("export API_URL=/api \n"); 
ls.stdin.write("echo 'start ' $API_URL \n"); 
ls.stdin.write("npm --version \n"); 
ls.stdin.write("echo $PWD \n"); 
// ls.stdin.end(); 