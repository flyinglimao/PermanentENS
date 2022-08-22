PermanentENS Miner
==================

This project is an example for miner to renew others' domain to earn.

get-repayable.js
---------------
`node get-configs.js <fromBlock> <toBlock>`
Example:
```sh
$ node get-configs.js
0x2fe4f115e6f3d66064c09d016dfd5e14b1c8780fe10b2d264da650b31f651351 0
0x2fe4f115e6f3d66064c09d016dfd5e14b1c8780fe10b2d264da650b31f651351 1
```  
Fetch active configs and display `<label> <config_idx>`.

get-label.js
---------------
`node get-label.js <ens>`
<small>Note: Don't end `<ens>` with `.eth`</small>

Get label of an ENS domain.

Example:
```
$ node get-label.js somedemo
0x2fe4f115e6f3d66064c09d016dfd5e14b1c8780fe10b2d264da650b31f651351
```

mine.js
---------------
`node mine.js <label> <config_idx> <duration>`
Renew the config for `<duration>`. Return a tx hash if success.

Example:
```
$ node mine.js 0x2fe4f115e6f3d66064c09d016dfd5e14b1c8780fe10b2d264da650b31f651351 0 31536000
0xa78e9d45c552634f2cd09826069abbd3bd1f8ef525e701aced77211e8a335856
```
