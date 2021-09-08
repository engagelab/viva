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

@available(iOS 13.0, *)
class OAuthViewModel: NSObject, ObservableObject, ASWebAuthenticationPresentationContextProviding {
    var authSession : ASWebAuthenticationSession

    required init(_ endpoint : URL, callbackScheme : String) {
        let url: URL = URL(string: callbackScheme)!
        let extractedScheme: String = url.scheme ?? callbackScheme
        self.authSession = ASWebAuthenticationSession(url: endpoint, callbackURLScheme: extractedScheme, completionHandler: { (callBack:URL?, error:Error?) in
            if let incomingUrl = callBack {
                NotificationCenter.default.post(name: NSNotification.Name.CDVPluginHandleOpenURL, object: incomingUrl)
            }
        })
    }

    func start() {
        self.authSession.presentationContextProvider = self
        self.authSession.start()
        /* DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { // Change `2.0` to the desired number of seconds. } */
    }

    func cancel() {
        self.authSession.cancel()
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return ASPresentationAnchor()
    }

}

@available(iOS 12.0, *)
class LoginViewController: UIViewController, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return ASPresentationAnchor()
    }
}

@available(iOS 13.0, *)
@objc(CDVOAuthPlugin)
class OAuthPlugin : CDVPlugin, ASWebAuthenticationPresentationContextProviding {
    var authSession : ASWebAuthenticationSession!
    var callbackScheme : String = ""
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
        UIApplication.shared.open(url, options: [:], completionHandler: nil)
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
        let extractedScheme: String = url.scheme ?? self.callbackScheme
        self.authSession = ASWebAuthenticationSession(url: url, callbackURLScheme: extractedScheme, completionHandler: { (callBack:URL?, error:Error?) in
            if let incomingUrl = callBack {
                NotificationCenter.default.post(name: NSNotification.Name.CDVPluginHandleOpenURL, object: incomingUrl)
            }
        })
        self.authSession.presentationContextProvider = self
        self.authSession.prefersEphemeralWebBrowserSession = true
        self.start()
        self.commandDelegate.send(CDVPluginResult(status: .ok), callbackId: command.callbackId)
        return
    }


    internal func parseToken(from url: URL) {
        self.authSession?.cancel()
        self.authSession = nil

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

        if !url.absoluteString.hasPrefix(self.callbackScheme) {
            return
        }

        self.parseToken(from: url)
    }

    func start() {
        self.authSession.start()
        /* DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { // Change `2.0` to the desired number of seconds. } */
    }

    func cancel() {
        self.authSession.cancel()
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return ASPresentationAnchor()
    }
}
