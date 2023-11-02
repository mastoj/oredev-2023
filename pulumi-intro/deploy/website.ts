import {
  Kind,
  SkuName,
  StorageAccount,
  StorageAccountStaticWebsite,
} from "@pulumi/azure-native/storage";
import { Record, RecordType, RecordTypes } from "@pulumi/dnsimple";
import {
  ComponentResource,
  ComponentResourceOptions,
  Input,
  Output,
  ProviderResource,
} from "@pulumi/pulumi";
import * as storage from "@pulumi/azure-native/storage";
import { FileAsset } from "@pulumi/pulumi/asset";

export interface DnsArgs {
  recordType: Input<RecordType>;
  hostOrIp: Input<string>;
}

export interface WebsiteArgs {
  resourceGroupName: Input<string>;
  dnsArgs: DnsArgs;
}

export class Website extends ComponentResource {
  name: string;
  staticEndpoint?: Output<string>;

  constructor(
    name: string,
    args: WebsiteArgs,
    opts?: ComponentResourceOptions
  ) {
    super(`2mas:components:Website`, name);
    const providers = opts?.providers! as globalThis.Record<
      string,
      ProviderResource
    >;
    const azureOptions = { parent: this, provider: providers["azure-native"] };
    const dnsimpleOptions = { parent: this };
    const storageAccountName = `2mas${name.replace(/-/g, "")}`;
    const staticWebsiteHostName = `${storageAccountName}.z6.web.core.windows.net`;

    const dnsRecord = new Record(
      `${name}-dns`,
      {
        domain: "2mas.xyz",
        name: name,
        ttl: "60",
        type: RecordTypes.CNAME,
        value: staticWebsiteHostName,
      },
      dnsimpleOptions
    );

    const delayedCustomDomainName = dnsRecord.name.apply<string>(
      async (name: string) => {
        return await new Promise((resolve) => {
          setTimeout(() => resolve(`${name}.2mas.xyz`), 10000);
        });
      }
    );
    const storageAccount = new StorageAccount(
      `${name}-storageaccount`,
      {
        enableHttpsTrafficOnly: true,
        accountName: storageAccountName,
        kind: Kind.StorageV2,
        resourceGroupName: args.resourceGroupName,
        sku: {
          name: SkuName.Standard_LRS,
        },
        customDomain: {
          name: delayedCustomDomainName,
        },
      },
      { ...azureOptions, dependsOn: [dnsRecord] }
    );

    // Enable static website support
    const staticWebsite = new StorageAccountStaticWebsite(
      `${name}-staticWebsite`,
      {
        accountName: storageAccount.name,
        resourceGroupName: args.resourceGroupName,
        indexDocument: "index.html",
        error404Document: "index.html",
      },
      azureOptions
    );

    // Upload files
    const indexFile = "index.html";
    const files = new storage.Blob(
      `${name}-${indexFile}`,
      {
        blobName: indexFile,
        resourceGroupName: args.resourceGroupName,
        accountName: storageAccount.name,
        containerName: staticWebsite.containerName,
        source: new FileAsset(`../../${indexFile}`),
        contentType: "text/html",
      },
      azureOptions
    );

    this.name = name;
    this.staticEndpoint = storageAccount.primaryEndpoints.web;
  }
}
