#!/bin/bash

echo "==> Clean up existing SP"
EXISTING_SP=$(az ad sp list --filter "displayname eq 'pulumidemo'" --query "[].{displayName:displayName, appId:appId}" -o json | jq -r ".[0].appId")
az ad sp delete --id $EXISTING_SP
az ad app delete --id $EXISTING_SP

echo "==> Create SP"
export DEMO_SUBSCRIPTION_ID=83a383e9-f8c5-4fe0-b11a-8b59d8c22f2e
SP_RESULT=$(az ad sp create-for-rbac --name pulumidemo --role contributor --scopes /subscriptions/$DEMO_SUBSCRIPTION_ID -o json)

echo "==> Export azure config"
export ARM_CLIENT_ID=$(echo $SP_RESULT | jq -r '.appId')
export ARM_CLIENT_SECRET=$(echo $SP_RESULT | jq -r '.password')
export ARM_SUBSCRIPTION_ID=$DEMO_SUBSCRIPTION_ID
export ARM_TENANT_ID=$(echo $SP_RESULT | jq -r '.tenant')

echo "==> Add permission for directory"
# https://blogs.aaddevsup.xyz/2018/06/guid-table-for-windows-azure-active-directory-permissions/
# https://learn.microsoft.com/en-us/graph/permissions-reference
# Application Graph
az ad app permission add --id $ARM_CLIENT_ID --api 00000003-0000-0000-c000-000000000000 --api-permissions 1bfefb4e-e0b5-418b-a88f-73c46d2cc8e9=Role
# Directory Graph
az ad app permission add --id $ARM_CLIENT_ID --api 00000003-0000-0000-c000-000000000000 --api-permissions 19dbc75e-c2e2-444c-a770-ec69d8559fc7=Role

sleep 15
az ad app permission admin-consent --id $ARM_CLIENT_ID

# User access administrator
az role assignment create --assignee $ARM_CLIENT_ID --role 18d7d88d-d35e-4fb5-a5c3-7773c20a72d9 --scope subscriptions/6d43a0fc-56b4-448e-9148-5a10ddeb74fb