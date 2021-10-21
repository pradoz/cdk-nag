/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
*/
import { CfnBucket } from '@aws-cdk/aws-s3';
import { CfnResource, Stack } from '@aws-cdk/core';
import { resolveIfPrimitive } from '../../../nag-pack';

/**
 * S3 Buckets are encrypted with a KMS Key by default - (Control IDs: AU-9(3), CP-9d, CP-9(8), SC-8(3), SC-8(4), SC-13a, SC-28(1), SI-19(4))
 * @param node the CfnResource to check
 */
export default function (node: CfnResource): boolean {
  if (node instanceof CfnBucket) {
    if (node.bucketEncryption == undefined) {
      return false;
    }
    const encryption = Stack.of(node).resolve(node.bucketEncryption);
    if (encryption.serverSideEncryptionConfiguration == undefined) {
      return false;
    }
    const sse = Stack.of(node).resolve(
      encryption.serverSideEncryptionConfiguration
    );
    for (const rule of sse) {
      const defaultEncryption = Stack.of(node).resolve(
        rule.serverSideEncryptionByDefault
      );
      if (defaultEncryption == undefined) {
        return false;
      }
      const sseAlgorithm = resolveIfPrimitive(
        node,
        defaultEncryption.sseAlgorithm
      );
      if (sseAlgorithm.toLowerCase() != 'aws:kms') {
        return false;
      }
    }
  }
  return true;
}