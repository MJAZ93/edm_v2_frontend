# UserCreateUserRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**email** | **string** |  | [optional] [default to undefined]
**name** | **string** |  | [optional] [default to undefined]
**password** | **string** |  | [optional] [default to undefined]
**type** | **string** | Type allowed values: SUPER_ADMIN, PAIS, REGIAO, ASC, PT | [optional] [default to undefined]
**type_id** | **string** |  | [optional] [default to undefined]
**username** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { UserCreateUserRequest } from './api';

const instance: UserCreateUserRequest = {
    email,
    name,
    password,
    type,
    type_id,
    username,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
