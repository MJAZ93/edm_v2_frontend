# AuthTokenResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**access_token** | **string** |  | [optional] [default to undefined]
**expires_in** | **number** |  | [optional] [default to undefined]
**refresh_token** | **string** |  | [optional] [default to undefined]
**user** | [**AuthLoggedUser**](AuthLoggedUser.md) |  | [optional] [default to undefined]

## Example

```typescript
import { AuthTokenResponse } from './api';

const instance: AuthTokenResponse = {
    access_token,
    expires_in,
    refresh_token,
    user,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
