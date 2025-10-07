# ComprasApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateComprasPfGet**](#privatecompraspfget) | **GET** /private/compras/{pf} | Get Compras by PF|

# **privateComprasPfGet**
> ComprasComprasListResponse privateComprasPfGet()

Get all compras records for a specific PF (Ponto de Fornecimento) from inspDB database, ordered by period descending

### Example

```typescript
import {
    ComprasApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ComprasApi(configuration);

let pf: string; //PF (Ponto de Fornecimento) (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateComprasPfGet(
    pf,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pf** | [**string**] | PF (Ponto de Fornecimento) | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ComprasComprasListResponse**

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

