//module.exports = {
  //apps : [{
  //  script: 'index.js',
  //  watch: '.'
  //}, {
    //script: './index.js/',
    //watch: ['./index.js']
  //}],

  //deploy : {
    //production : {
     // user : 'SSH_USERNAME',
     // host : 'SSH_HOSTMACHINE',
     // ref  : 'origin/master',
     // repo : 'GIT_REPOSITORY',
     // path : 'DESTINATION_PATH',
     // 'pre-deploy-local': '',
     // 'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
     // 'pre-setup': ''
    //}
 // }
//};


module.exports = {
  apps: [
    {
      name: "node-backend",
      script: "dist/index.js", // Entry file
      instances: "max",    // Run in cluster mode with all CPUs
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};

