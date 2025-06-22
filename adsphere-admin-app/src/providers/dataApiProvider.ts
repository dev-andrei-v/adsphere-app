import {
    BaseRecord, CreateParams, CreateResponse,
    DataProvider,
    DeleteOneParams,
    DeleteOneResponse,
    GetOneParams,
    GetOneResponse,
    UpdateParams,
    UpdateResponse
} from "@refinedev/core";
import axios from "axios";
import {TOKEN_KEY} from "./authProvider";
import { API_URL } from "../api";

export const dataApiProvider: DataProvider = {

    getList: async ({resource, pagination, filters}) => {
        const token = localStorage.getItem(TOKEN_KEY);

        const current = pagination?.current || 1;
        const pageSize = pagination?.pageSize || 20;

        const params: any = {
            page: current,
            pageSize: pageSize,
        };

        // Adăugăm filtrele în query string
        filters?.forEach((filter) => {
            if (filter.operator === "eq" && typeof filter.value === "string") {
                params[filter.field] = filter.value;
            }
        });

        const response = await axios.get(`${API_URL}/${resource}`, {
            params: params,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        console.log(response)
        return {
            data: response.data.data, // data este un array de obiecte
            total: response.data.total
        };
    },
    getOne: function <TData extends BaseRecord = BaseRecord>(params: GetOneParams): Promise<GetOneResponse<TData>> {
        const token = localStorage.getItem(TOKEN_KEY);
        const {resource, id} = params;
        console.log("Fetching ONE:", resource, id);
        return axios.get(`${API_URL}/${resource}/${id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }).then(response => ({
            data: response.data.data,
        })).catch(error => {
            console.error("Error fetching data:", error);
            throw new Error("Error fetching data");
        })
    },
    create: function <TData extends BaseRecord = BaseRecord, TVariables = {}>(params: CreateParams<TVariables>): Promise<CreateResponse<TData>> {
        const token = localStorage.getItem(TOKEN_KEY);
        const {resource, variables} = params;
        return axios.post(`${API_URL}/${resource}`, variables, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }).then(response => ({
            data: response.data.data,
        })).catch(error => {
            console.error("Error creating data:", error);
            throw new Error("Error creating data");
        })
    },
    update: function <TData extends BaseRecord = BaseRecord, TVariables = {}>(params: UpdateParams<TVariables>): Promise<UpdateResponse<TData>> {
        const token = localStorage.getItem(TOKEN_KEY);
        const {resource, id, variables} = params;
        return axios.put(`${API_URL}/${resource}/${id}`, variables, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }).then(response => ({
            data: response.data.data,
        })).catch(error => {
            console.error("Error updating data:", error);
            throw new Error("Error updating data");
        })
    },
    deleteOne: function <TData extends BaseRecord = BaseRecord, TVariables = {}>(params: DeleteOneParams<TVariables>): Promise<DeleteOneResponse<TData>> {
        throw new Error("Function not implemented.");
    },
    getApiUrl: function (): string {
        return API_URL;
    }
};

export const axiosWithHeaders = axios.create({
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
    },
})
