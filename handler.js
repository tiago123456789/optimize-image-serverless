'use strict';

const Aws = require("aws-sdk");
const sharp = require("sharp");
const { basename, extname } = require("path");

const S3 = new Aws.S3();

module.exports.main = async ({ Records: records }) => {

  await Promise
    .all(records.map(async record => {
      const { key } = record.s3.object;

      const image = await S3.getObject({
        Bucket: process.env.bucket,
        Key: key
      }).promise();

      const optimizedImage = await sharp(image.Body)
        .resize(1280, 720, { fit: 'inside', withoutEnlargement: true })
        .toFormat('jpeg', { progressive: true, quality: 50 })
        .toBuffer();

      const pathname = basename(key, extname(key));
      await S3.putObject({
        Body: optimizedImage,
        Bucket: process.env.bucket,
        ContentType: 'image/jpeg',
        Key: `optimized/${pathname}.jpeg`
      }).promise();

    }));

  return {
    statusCode: 201,
    body: {}
  };
};
