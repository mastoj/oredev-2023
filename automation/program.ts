import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import {
  InlineProgramArgs,
  LocalWorkspace,
  Stack,
} from "@pulumi/pulumi/automation";

class MyResource extends pulumi.ComponentResource {
  resourceGroupName: pulumi.Output<string>;
  constructor(name: string) {
    super("oredev:myresource", name);
    const resourceGroup = new azure.resources.ResourceGroup(name, {
      location: "West Europe",
    });
    this.resourceGroupName = resourceGroup.name;
  }
}

const program = async (resourceGroupName: string) => {
  const myResource = new MyResource(resourceGroupName);
  const result = {
    resourceGroupName: myResource.resourceGroupName,
  };
  return result;
};

export type CreateArgs = {
  resourceGroupName: string;
  stackName: string;
};
export const up = async ({ resourceGroupName, stackName }: CreateArgs) => {
  const stack = await LocalWorkspace.createOrSelectStack({
    stackName: stackName,
    projectName: "automation",
    program: () => program(resourceGroupName),
  });
  const upRes = await stack.up();
  console.log(upRes.outputs);
  return upRes.outputs;
};

export const list = async () => {
  const workspace = await LocalWorkspace.create({
    projectSettings: {
      name: `automation`,
      runtime: "nodejs",
    },
  });

  const stacks = await workspace.listStacks();
  return stacks;
};

export const destroy = async ({ stackName }: { stackName: string }) => {
  const stack = await LocalWorkspace.createOrSelectStack({
    stackName: stackName,
    projectName: "automation",
    program: async () => {},
  });
  const ws = stack.workspace;
  const destroyRes = await stack.destroy();
  await ws.removeStack(stackName);
  return destroyRes;
};
