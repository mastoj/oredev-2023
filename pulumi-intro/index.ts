import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const config = new pulumi.Config();
const rgName = config.require("rgName");

const resourceGroup = new azure.resources.ResourceGroup("resourceGroup", {
  resourceGroupName: rgName,
  location: "West Europe",
});

export const resourceGroupName = resourceGroup.name;
