const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

const isValidIp = ip => /([0-9]+\.)+/.test(ip);

const get = () =>
  execPromise('scutil --dns | grep nameserver[[0-9]*]')
    .then(ips => ips
      .split('\n')
      .filter(isValidIp)
      .filter((ip, i, arr) => arr.indexOf(ip) === i)
      .map(labeledIp => labeledIp.replace(/\s+nameserver\[[0-9]\] : /, '')));

const setDNS = ips => execPromise(`networksetup -setdnsservers Wi-Fi ${ips.join(' ')}`);

const add = ip => get()
  .then((ips) => {
    if (isValidIp(ip) && !ips.includes(ip)) ips.push(ip);
    return ips;
  })
  .then(dnsAddresses => setDNS(dnsAddresses));

const rm = dnsAddress => get()
  .then(current => current.filter(existingDNS => existingDNS !== dnsAddress))
  .then(dnsAddresses => setDNS(dnsAddresses));

const reset = () => execPromise('networksetup -setdnsservers Wi-Fi empty');

module.exports = {
  get, setDNS, add, rm, reset,
};
