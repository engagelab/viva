/**
 * Copyright 2019 Ayogo Health Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import os.log
import Foundation
import AuthenticationServices
import SafariServices

@available(iOS 12.0, *)
@objc protocol OAuthSessionProvider {
    var aswas : ASWebAuthenticationSession { get set }
    init(_ endpoint : URL, callbackScheme : String)
    func start() -> Void
    func cancel() -> Void
}

@available(iOS 12.0, *)
class ASWebAuthenticationSessionOAuthSessionProvider : OAuthSessionProvider {
    public var aswas : ASWebAuthenticationSession

    required init(_ endpoint : URL, callbackScheme : String) {
        let url: URL = URL(string: callbackScheme)!
        let extractedScheme: String = url.scheme ?? callbackScheme
        self.aswas = ASWebAuthenticationSession(url: endpoint, callbackURLScheme: extractedScheme, completionHandler: { (callBack:URL?, error:Error?) in
            if let incomingUrl = callBack {
                NotificationCenter.default.post(name: NSNotification.Name.CDVPluginHandleOpenURL, object: incomingUrl)
            }
        })
    }

    func start() {
        self.aswas.start()
        /* DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { // Change `2.0` to the desired number of seconds. } */
    }

    func cancel() {
        self.aswas.cancel()
    }
}

@available(iOS 12.0, *)
@objc(CDVOAuthPlugin)
class OAuthPlugin : CDVPlugin, SFSafariViewControllerDelegate, ASWebAuthenticationPresentationContextProviding {
    var authSystem : OAuthSessionProvider?
    var callbackScheme : String?
    var logger : OSLog?

    override func pluginInitialize() {
        let urlScheme = self.commandDelegate.settings["oauthscheme"] as! String

        self.callbackScheme = "\(urlScheme)://oauth_callback"
        self.logger = OSLog(subsystem: urlScheme, category: "Cordova")

        NotificationCenter.default.addObserver(self,
                selector: #selector(OAuthPlugin._handleOpenURL(_:)),
                name: NSNotification.Name.CDVPluginHandleOpenURL,
                object: nil)
    }

    @objc func openInSystem(_ command : CDVInvokedUrlCommand) {
        guard let webEndpoint = command.argument(at: 0) as? String else {
            self.commandDelegate.send(CDVPluginResult(status: .error), callbackId: command.callbackId)
            return
        }
        guard let url = URL(string: webEndpoint) else {
            self.commandDelegate.send(CDVPluginResult(status: .error), callbackId: command.callbackId)
            return
        }
        if #available(iOS 10.0, *) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        } else {
            UIApplication.shared.openURL(url)
        }
    }

    @objc func startOAuth(_ command : CDVInvokedUrlCommand) {
        guard let authEndpoint = command.argument(at: 0) as? String else {
            self.commandDelegate.send(CDVPluginResult(status: .error), callbackId: command.callbackId)
            return
        }

        guard let url = URL(string: authEndpoint) else {
            self.commandDelegate.send(CDVPluginResult(status: .error), callbackId: command.callbackId)
            return
        }

        if #available(iOS 13.0, *) {
            self.authSystem = ASWebAuthenticationSessionOAuthSessionProvider(url, callbackScheme:self.callbackScheme!)
            self.authSystem?.aswas.presentationContextProvider = self
        }

        self.authSystem?.start()

        self.commandDelegate.send(CDVPluginResult(status: .ok), callbackId: command.callbackId)
        return
    }


    internal func parseToken(from url: URL) {
        self.authSystem?.cancel()
        self.authSystem = nil

        var jsobj : [String : String] = [:]
        let queryItems = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems

        queryItems?.forEach {
            jsobj[$0.name] = $0.value
        }

        os_log("OAuth called back with parameters.", log: self.logger!, type: .info)

        do {
            let data = try JSONSerialization.data(withJSONObject: jsobj)
            let msg = String(data: data, encoding: .utf8)!

            self.webViewEngine.evaluateJavaScript("window.dispatchEvent(new MessageEvent('message', { data: 'oauth::\(msg)' }));", completionHandler: nil)
        } catch {
            let errStr = "JSON Serialization failed: \(error)"
            os_log("%@", log: self.logger!, type: .error, errStr)
        }
    }


    @objc internal func _handleOpenURL(_ notification : NSNotification) {
        guard let url = notification.object as? URL else {
            return
        }

        if !url.absoluteString.hasPrefix(self.callbackScheme!) {
            return
        }

        self.parseToken(from: url)
    }

    @available(iOS 13.0, *)
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return ASPresentationAnchor()
    }
}
