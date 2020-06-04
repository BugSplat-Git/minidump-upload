const fs = require('fs');
const path = require('path');
const request = require('request');
const rxjs = require('rxjs');

const database = 'Fred';
const prod = 'MyQtCrasher';
const ver = '1.0';
const key = 'key';
const email = 'fred@bugsplat.com';
const comments = 'comments';

const dmpFolder = './dmp';
const files = fs.readdirSync(dmpFolder)
    .filter(file => file.endsWith(".dmp"));

// Uploads an array of dmp files in series
// Return a promise for the upload of each file and waits 2 seconds
// between each upload to prevent rate limiting from BugSplat
const uploadPromise = files.reduce(async (previous, current) => {
    const fullPath = path.join(dmpFolder, current);
    return previous
        .then(() => rxjs.timer(2000).toPromise())
        .then(() => uploadFile(fullPath))
        .catch((error) => console.error(error));
}, Promise.resolve());

return uploadPromise.then(() => console.log('done!'));

function uploadFile(filePath) {
    console.log(`uploading ${filePath}`);

    const method = 'POST';
    const uri = `https://fred.bugsplat.com/post/bp/crash/postBP.php`;
    const formData = {
        database,
        prod,
        ver,
        key,
        email,
        comments,
        upload_file_minidump: {
            value: fs.createReadStream(filePath),
            options: {
                filename: path.basename(filePath)
            }
        }
    };

    const options = {
        method,
        uri,
        formData
    };

    return new Promise((resolve, reject) => {
        request(options, function (err, response, body) {
            if (err) {
                reject(err);
            } else if (response.statusCode != 200) {
                reject(response);
            } else if (!body) {
                resolve(false);        
            } else {
                console.log(`success ${filePath}`);
                resolve(JSON.parse(body));
            }
        });
    });
}
