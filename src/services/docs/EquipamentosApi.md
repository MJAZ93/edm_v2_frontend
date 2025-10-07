# EquipamentosApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateEquipamentosInspeccaoIdGet**](#privateequipamentosinspeccaoidget) | **GET** /private/equipamentos/{inspeccao_id} | Get Equipamentos by inspection ID|

# **privateEquipamentosInspeccaoIdGet**
> EquipamentosEquipamentosListResponse privateEquipamentosInspeccaoIdGet()

Get all equipamentos records for a specific inspection ID from inspDB database

### Example

```typescript
import {
    EquipamentosApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new EquipamentosApi(configuration);

let inspeccaoId: string; //Inspection ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateEquipamentosInspeccaoIdGet(
    inspeccaoId,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **inspeccaoId** | [**string**] | Inspection ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**EquipamentosEquipamentosListResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

