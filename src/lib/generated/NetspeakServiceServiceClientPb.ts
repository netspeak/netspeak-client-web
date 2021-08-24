/**
 * @fileoverview gRPC-Web generated client stub for netspeak.service
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck


import * as grpcWeb from 'grpc-web';

import {
  CorporaRequest,
  CorporaResponse,
  SearchRequest,
  SearchResponse} from './NetspeakService_pb';

export class NetspeakServiceClient {
  client_: grpcWeb.AbstractClientBase;
  hostname_: string;
  credentials_: null | { [index: string]: string; };
  options_: null | { [index: string]: string; };

  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; }) {
    if (!options) options = {};
    if (!credentials) credentials = {};
    options['format'] = 'text';

    this.client_ = new grpcWeb.GrpcWebClientBase(options);
    this.hostname_ = hostname;
    this.credentials_ = credentials;
    this.options_ = options;
  }

  methodInfoSearch = new grpcWeb.AbstractClientBase.MethodInfo(
    SearchResponse,
    (request: SearchRequest) => {
      return request.serializeBinary();
    },
    SearchResponse.deserializeBinary
  );

  search(
    request: SearchRequest,
    metadata: grpcWeb.Metadata | null): Promise<SearchResponse>;

  search(
    request: SearchRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: SearchResponse) => void): grpcWeb.ClientReadableStream<SearchResponse>;

  search(
    request: SearchRequest,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: SearchResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        new URL('/netspeak.service.NetspeakService/Search', this.hostname_).toString(),
        request,
        metadata || {},
        this.methodInfoSearch,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/netspeak.service.NetspeakService/Search',
    request,
    metadata || {},
    this.methodInfoSearch);
  }

  methodInfoGetCorpora = new grpcWeb.AbstractClientBase.MethodInfo(
    CorporaResponse,
    (request: CorporaRequest) => {
      return request.serializeBinary();
    },
    CorporaResponse.deserializeBinary
  );

  getCorpora(
    request: CorporaRequest,
    metadata: grpcWeb.Metadata | null): Promise<CorporaResponse>;

  getCorpora(
    request: CorporaRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: CorporaResponse) => void): grpcWeb.ClientReadableStream<CorporaResponse>;

  getCorpora(
    request: CorporaRequest,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: CorporaResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        new URL('/netspeak.service.NetspeakService/GetCorpora', this.hostname_).toString(),
        request,
        metadata || {},
        this.methodInfoGetCorpora,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/netspeak.service.NetspeakService/GetCorpora',
    request,
    metadata || {},
    this.methodInfoGetCorpora);
  }

}

