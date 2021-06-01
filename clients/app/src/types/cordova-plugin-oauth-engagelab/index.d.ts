// Type definitions for Apache Cordova File System plugin
// Project: https://github.com/apache/cordova-plugin-file
// Definitions by: Microsoft Open Technologies Inc <http://msopentech.com>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
//
// Copyright (c) Microsoft Open Technologies, Inc.
// Licensed under the MIT license.
/// <reference types="cordova" />

/**
 * Requests plugin to display authentication window
 * @param url               Which site to visit upon opening the window
 * @param scheme            Plugin trigger
 * @param params            Additional state params to pass through
 */
export type OAuth = (url: string, scheme: string, params: string) => void

declare global {
  interface Window {
    OAuth: OAuth
  }
}
