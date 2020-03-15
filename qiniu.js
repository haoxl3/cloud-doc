const QiniuManager = require('./src/utils/QiniuManager');

var accessKey = 'iDKB7C3zD5mm8SLUEa3-3zXUinVi9OeZdiaaLy8L';
var secretKey = 'eLPzGjTsJhDkOzM-dJ92N_5qxpCi7F4cXJ65OcqE';
const localFile = 'E:\\name.md';
const key = 'name.md';

const manager = new QiniuManager(accessKey, secretKey, 'cloudhaoxl');
// manager.uploadFile(key, localFile);
manager.deleteFile(key);
// 下载文件
// var bucketManager = new qiniu.rs.BucketManager(mac, config);
// var publicBucketDomain = 'http://q78ctcq7h.bkt.clouddn.com';
// 公开空间访问链接
// var publicDownloadUrl = bucketManager.publicDownloadUrl(publicBucketDomain, key);
// console.log(publicDownloadUrl);