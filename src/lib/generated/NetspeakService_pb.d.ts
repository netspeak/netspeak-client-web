import * as jspb from "google-protobuf"

export class SearchRequest extends jspb.Message {
  getQuery(): string;
  setQuery(value: string): SearchRequest;

  getCorpus(): string;
  setCorpus(value: string): SearchRequest;

  getMaxPhrases(): number;
  setMaxPhrases(value: number): SearchRequest;

  getPhraseConstraints(): PhraseConstraints | undefined;
  setPhraseConstraints(value?: PhraseConstraints): SearchRequest;
  hasPhraseConstraints(): boolean;
  clearPhraseConstraints(): SearchRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SearchRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SearchRequest): SearchRequest.AsObject;
  static serializeBinaryToWriter(message: SearchRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SearchRequest;
  static deserializeBinaryFromReader(message: SearchRequest, reader: jspb.BinaryReader): SearchRequest;
}

export namespace SearchRequest {
  export type AsObject = {
    query: string,
    corpus: string,
    maxPhrases: number,
    phraseConstraints?: PhraseConstraints.AsObject,
  }
}

export class PhraseConstraints extends jspb.Message {
  getFrequencyMax(): number;
  setFrequencyMax(value: number): PhraseConstraints;

  getWordsMin(): number;
  setWordsMin(value: number): PhraseConstraints;

  getWordsMax(): number;
  setWordsMax(value: number): PhraseConstraints;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PhraseConstraints.AsObject;
  static toObject(includeInstance: boolean, msg: PhraseConstraints): PhraseConstraints.AsObject;
  static serializeBinaryToWriter(message: PhraseConstraints, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PhraseConstraints;
  static deserializeBinaryFromReader(message: PhraseConstraints, reader: jspb.BinaryReader): PhraseConstraints;
}

export namespace PhraseConstraints {
  export type AsObject = {
    frequencyMax: number,
    wordsMin: number,
    wordsMax: number,
  }
}

export class Phrase extends jspb.Message {
  getId(): number;
  setId(value: number): Phrase;

  getFrequency(): number;
  setFrequency(value: number): Phrase;

  getWordsList(): Array<Phrase.Word>;
  setWordsList(value: Array<Phrase.Word>): Phrase;
  clearWordsList(): Phrase;
  addWords(value?: Phrase.Word, index?: number): Phrase.Word;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Phrase.AsObject;
  static toObject(includeInstance: boolean, msg: Phrase): Phrase.AsObject;
  static serializeBinaryToWriter(message: Phrase, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Phrase;
  static deserializeBinaryFromReader(message: Phrase, reader: jspb.BinaryReader): Phrase;
}

export namespace Phrase {
  export type AsObject = {
    id: number,
    frequency: number,
    wordsList: Array<Phrase.Word.AsObject>,
  }

  export class Word extends jspb.Message {
    getTag(): Phrase.Word.Tag;
    setTag(value: Phrase.Word.Tag): Word;

    getText(): string;
    setText(value: string): Word;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Word.AsObject;
    static toObject(includeInstance: boolean, msg: Word): Word.AsObject;
    static serializeBinaryToWriter(message: Word, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Word;
    static deserializeBinaryFromReader(message: Word, reader: jspb.BinaryReader): Word;
  }

  export namespace Word {
    export type AsObject = {
      tag: Phrase.Word.Tag,
      text: string,
    }

    export enum Tag { 
      WORD = 0,
      WORD_FOR_QMARK = 1,
      WORD_FOR_STAR = 2,
      WORD_IN_DICTSET = 3,
      WORD_IN_ORDERSET = 4,
      WORD_IN_OPTIONSET = 5,
      WORD_FOR_PLUS = 6,
      WORD_FOR_REGEX = 7,
    }
  }

}

export class SearchResponse extends jspb.Message {
  getResult(): SearchResponse.Result | undefined;
  setResult(value?: SearchResponse.Result): SearchResponse;
  hasResult(): boolean;
  clearResult(): SearchResponse;

  getError(): SearchResponse.Error | undefined;
  setError(value?: SearchResponse.Error): SearchResponse;
  hasError(): boolean;
  clearError(): SearchResponse;

  getResponseCase(): SearchResponse.ResponseCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SearchResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SearchResponse): SearchResponse.AsObject;
  static serializeBinaryToWriter(message: SearchResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SearchResponse;
  static deserializeBinaryFromReader(message: SearchResponse, reader: jspb.BinaryReader): SearchResponse;
}

export namespace SearchResponse {
  export type AsObject = {
    result?: SearchResponse.Result.AsObject,
    error?: SearchResponse.Error.AsObject,
  }

  export class Result extends jspb.Message {
    getPhrasesList(): Array<Phrase>;
    setPhrasesList(value: Array<Phrase>): Result;
    clearPhrasesList(): Result;
    addPhrases(value?: Phrase, index?: number): Phrase;

    getUnknownWordsList(): Array<string>;
    setUnknownWordsList(value: Array<string>): Result;
    clearUnknownWordsList(): Result;
    addUnknownWords(value: string, index?: number): Result;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Result.AsObject;
    static toObject(includeInstance: boolean, msg: Result): Result.AsObject;
    static serializeBinaryToWriter(message: Result, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Result;
    static deserializeBinaryFromReader(message: Result, reader: jspb.BinaryReader): Result;
  }

  export namespace Result {
    export type AsObject = {
      phrasesList: Array<Phrase.AsObject>,
      unknownWordsList: Array<string>,
    }
  }


  export class Error extends jspb.Message {
    getKind(): SearchResponse.Error.Kind;
    setKind(value: SearchResponse.Error.Kind): Error;

    getMessage(): string;
    setMessage(value: string): Error;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Error.AsObject;
    static toObject(includeInstance: boolean, msg: Error): Error.AsObject;
    static serializeBinaryToWriter(message: Error, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Error;
    static deserializeBinaryFromReader(message: Error, reader: jspb.BinaryReader): Error;
  }

  export namespace Error {
    export type AsObject = {
      kind: SearchResponse.Error.Kind,
      message: string,
    }

    export enum Kind { 
      UNKNOWN = 0,
      INTERNAL_ERROR = 1,
      INVALID_PARAMETER = 100,
      INVALID_QUERY = 110,
      INVALID_CORPUS = 111,
    }
  }


  export enum ResponseCase { 
    RESPONSE_NOT_SET = 0,
    RESULT = 1,
    ERROR = 2,
  }
}

export class CorporaRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CorporaRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CorporaRequest): CorporaRequest.AsObject;
  static serializeBinaryToWriter(message: CorporaRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CorporaRequest;
  static deserializeBinaryFromReader(message: CorporaRequest, reader: jspb.BinaryReader): CorporaRequest;
}

export namespace CorporaRequest {
  export type AsObject = {
  }
}

export class Corpus extends jspb.Message {
  getKey(): string;
  setKey(value: string): Corpus;

  getName(): string;
  setName(value: string): Corpus;

  getLanguage(): string;
  setLanguage(value: string): Corpus;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Corpus.AsObject;
  static toObject(includeInstance: boolean, msg: Corpus): Corpus.AsObject;
  static serializeBinaryToWriter(message: Corpus, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Corpus;
  static deserializeBinaryFromReader(message: Corpus, reader: jspb.BinaryReader): Corpus;
}

export namespace Corpus {
  export type AsObject = {
    key: string,
    name: string,
    language: string,
  }
}

export class CorporaResponse extends jspb.Message {
  getCorporaList(): Array<Corpus>;
  setCorporaList(value: Array<Corpus>): CorporaResponse;
  clearCorporaList(): CorporaResponse;
  addCorpora(value?: Corpus, index?: number): Corpus;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CorporaResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CorporaResponse): CorporaResponse.AsObject;
  static serializeBinaryToWriter(message: CorporaResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CorporaResponse;
  static deserializeBinaryFromReader(message: CorporaResponse, reader: jspb.BinaryReader): CorporaResponse;
}

export namespace CorporaResponse {
  export type AsObject = {
    corporaList: Array<Corpus.AsObject>,
  }
}

