/*
 Copyright 2020, 2021 Richard Nesnass, Sharanya Manivasagam, and Ole Smørdal

 This file is part of VIVA.

 VIVA is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 GPL-3.0-only or GPL-3.0-or-later

 VIVA is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with VIVA.  If not, see <http://www.gnu.org/licenses/>.
 */

enum AndroidPermissions {
  ACCESS_CHECKIN_PROPERTIES = 'android.permission.ACCESS_CHECKIN_PROPERTIES',
  ACCESS_COARSE_LOCATION = 'android.permission.ACCESS_COARSE_LOCATION',
  ACCESS_FINE_LOCATION = 'android.permission.ACCESS_FINE_LOCATION',
  ACCESS_LOCATION_EXTRA_COMMANDS = 'android.permission.ACCESS_LOCATION_EXTRA_COMMANDS',
  ACCESS_MOCK_LOCATION = 'android.permission.ACCESS_MOCK_LOCATION',
  ACCESS_NETWORK_STATE = 'android.permission.ACCESS_NETWORK_STATE',
  ACCESS_SURFACE_FLINGER = 'android.permission.ACCESS_SURFACE_FLINGER',
  ACCESS_WIFI_STATE = 'android.permission.ACCESS_WIFI_STATE',
  ACCOUNT_MANAGER = 'android.permission.ACCOUNT_MANAGER',
  ADD_VOICEMAIL = 'com.android.voicemail.permission.ADD_VOICEMAIL',
  AUTHENTICATE_ACCOUNTS = 'android.permission.AUTHENTICATE_ACCOUNTS',
  BATTERY_STATS = 'android.permission.BATTERY_STATS',
  BIND_ACCESSIBILITY_SERVICE = 'android.permission.BIND_ACCESSIBILITY_SERVICE',
  BIND_APPWIDGET = 'android.permission.BIND_APPWIDGET',
  BIND_CARRIER_MESSAGING_SERVICE = 'android.permission.BIND_CARRIER_MESSAGING_SERVICE',
  BIND_DEVICE_ADMIN = 'android.permission.BIND_DEVICE_ADMIN',
  BIND_DREAM_SERVICE = 'android.permission.BIND_DREAM_SERVICE',
  BIND_INPUT_METHOD = 'android.permission.BIND_INPUT_METHOD',
  BIND_NFC_SERVICE = 'android.permission.BIND_NFC_SERVICE',
  BIND_NOTIFICATION_LISTENER_SERVICE = 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
  BIND_PRINT_SERVICE = 'android.permission.BIND_PRINT_SERVICE',
  BIND_REMOTEVIEWS = 'android.permission.BIND_REMOTEVIEWS',
  BIND_TEXT_SERVICE = 'android.permission.BIND_TEXT_SERVICE',
  BIND_TV_INPUT = 'android.permission.BIND_TV_INPUT',
  BIND_VOICE_INTERACTION = 'android.permission.BIND_VOICE_INTERACTION',
  BIND_VPN_SERVICE = 'android.permission.BIND_VPN_SERVICE',
  BIND_WALLPAPER = 'android.permission.BIND_WALLPAPER',
  BLUETOOTH = 'android.permission.BLUETOOTH',
  BLUETOOTH_ADMIN = 'android.permission.BLUETOOTH_ADMIN',
  BLUETOOTH_PRIVILEGED = 'android.permission.BLUETOOTH_PRIVILEGED',
  BODY_SENSORS = 'android.permission.BODY_SENSORS',
  BRICK = 'android.permission.BRICK',
  BROADCAST_PACKAGE_REMOVED = 'android.permission.BROADCAST_PACKAGE_REMOVED',
  BROADCAST_SMS = 'android.permission.BROADCAST_SMS',
  BROADCAST_STICKY = 'android.permission.BROADCAST_STICKY',
  BROADCAST_WAP_PUSH = 'android.permission.BROADCAST_WAP_PUSH',
  CALL_PHONE = 'android.permission.CALL_PHONE',
  CALL_PRIVILEGED = 'android.permission.CALL_PRIVILEGED',
  CAMERA = 'android.permission.CAMERA',
  CAPTURE_AUDIO_OUTPUT = 'android.permission.CAPTURE_AUDIO_OUTPUT',
  CAPTURE_SECURE_VIDEO_OUTPUT = 'android.permission.CAPTURE_SECURE_VIDEO_OUTPUT',
  CAPTURE_VIDEO_OUTPUT = 'android.permission.CAPTURE_VIDEO_OUTPUT',
  CHANGE_COMPONENT_ENABLED_STATE = 'android.permission.CHANGE_COMPONENT_ENABLED_STATE',
  CHANGE_CONFIGURATION = 'android.permission.CHANGE_CONFIGURATION',
  CHANGE_NETWORK_STATE = 'android.permission.CHANGE_NETWORK_STATE',
  CHANGE_WIFI_MULTICAST_STATE = 'android.permission.CHANGE_WIFI_MULTICAST_STATE',
  CHANGE_WIFI_STATE = 'android.permission.CHANGE_WIFI_STATE',
  CLEAR_APP_CACHE = 'android.permission.CLEAR_APP_CACHE',
  CLEAR_APP_USER_DATA = 'android.permission.CLEAR_APP_USER_DATA',
  CONTROL_LOCATION_UPDATES = 'android.permission.CONTROL_LOCATION_UPDATES',
  DELETE_CACHE_FILES = 'android.permission.DELETE_CACHE_FILES',
  DELETE_PACKAGES = 'android.permission.DELETE_PACKAGES',
  DEVICE_POWER = 'android.permission.DEVICE_POWER',
  DIAGNOSTIC = 'android.permission.DIAGNOSTIC',
  DISABLE_KEYGUARD = 'android.permission.DISABLE_KEYGUARD',
  DUMP = 'android.permission.DUMP',
  EXPAND_STATUS_BAR = 'android.permission.EXPAND_STATUS_BAR',
  FACTORY_TEST = 'android.permission.FACTORY_TEST',
  FLASHLIGHT = 'android.permission.FLASHLIGHT',
  FORCE_BACK = 'android.permission.FORCE_BACK',
  GET_ACCOUNTS = 'android.permission.GET_ACCOUNTS',
  GET_PACKAGE_SIZE = 'android.permission.GET_PACKAGE_SIZE',
  GET_TASKS = 'android.permission.GET_TASKS',
  GET_TOP_ACTIVITY_INFO = 'android.permission.GET_TOP_ACTIVITY_INFO',
  GLOBAL_SEARCH = 'android.permission.GLOBAL_SEARCH',
  HARDWARE_TEST = 'android.permission.HARDWARE_TEST',
  INJECT_EVENTS = 'android.permission.INJECT_EVENTS',
  INSTALL_LOCATION_PROVIDER = 'android.permission.INSTALL_LOCATION_PROVIDER',
  INSTALL_PACKAGES = 'android.permission.INSTALL_PACKAGES',
  INSTALL_SHORTCUT = 'com.android.launcher.permission.INSTALL_SHORTCUT',
  INTERNAL_SYSTEM_WINDOW = 'android.permission.INTERNAL_SYSTEM_WINDOW',
  INTERNET = 'android.permission.INTERNET',
  KILL_BACKGROUND_PROCESSES = 'android.permission.KILL_BACKGROUND_PROCESSES',
  LOCATION_HARDWARE = 'android.permission.LOCATION_HARDWARE',
  MANAGE_ACCOUNTS = 'android.permission.MANAGE_ACCOUNTS',
  MANAGE_APP_TOKENS = 'android.permission.MANAGE_APP_TOKENS',
  MANAGE_DOCUMENTS = 'android.permission.MANAGE_DOCUMENTS',
  MASTER_CLEAR = 'android.permission.MASTER_CLEAR',
  MEDIA_CONTENT_CONTROL = 'android.permission.MEDIA_CONTENT_CONTROL',
  MODIFY_AUDIO_SETTINGS = 'android.permission.MODIFY_AUDIO_SETTINGS',
  MODIFY_PHONE_STATE = 'android.permission.MODIFY_PHONE_STATE',
  MOUNT_FORMAT_FILESYSTEMS = 'android.permission.MOUNT_FORMAT_FILESYSTEMS',
  MOUNT_UNMOUNT_FILESYSTEMS = 'android.permission.MOUNT_UNMOUNT_FILESYSTEMS',
  NFC = 'android.permission.NFC',
  PERSISTENT_ACTIVITY = 'android.permission.PERSISTENT_ACTIVITY',
  PROCESS_OUTGOING_CALLS = 'android.permission.PROCESS_OUTGOING_CALLS',
  READ_CALENDAR = 'android.permission.READ_CALENDAR',
  READ_CALL_LOG = 'android.permission.READ_CALL_LOG',
  READ_CONTACTS = 'android.permission.READ_CONTACTS',
  READ_EXTERNAL_STORAGE = 'android.permission.READ_EXTERNAL_STORAGE',
  READ_FRAME_BUFFER = 'android.permission.READ_FRAME_BUFFER',
  READ_HISTORY_BOOKMARKS = 'com.android.browser.permission.READ_HISTORY_BOOKMARKS',
  READ_INPUT_STATE = 'android.permission.READ_INPUT_STATE',
  READ_LOGS = 'android.permission.READ_LOGS',
  READ_PHONE_STATE = 'android.permission.READ_PHONE_STATE',
  READ_PROFILE = 'android.permission.READ_PROFILE',
  READ_SMS = 'android.permission.READ_SMS',
  READ_SOCIAL_STREAM = 'android.permission.READ_SOCIAL_STREAM',
  READ_SYNC_SETTINGS = 'android.permission.READ_SYNC_SETTINGS',
  READ_SYNC_STATS = 'android.permission.READ_SYNC_STATS',
  READ_USER_DICTIONARY = 'android.permission.READ_USER_DICTIONARY',
  READ_VOICEMAIL = 'com.android.voicemail.permission.READ_VOICEMAIL',
  REBOOT = 'android.permission.REBOOT',
  RECEIVE_BOOT_COMPLETED = 'android.permission.RECEIVE_BOOT_COMPLETED',
  RECEIVE_MMS = 'android.permission.RECEIVE_MMS',
  RECEIVE_SMS = 'android.permission.RECEIVE_SMS',
  RECEIVE_WAP_PUSH = 'android.permission.RECEIVE_WAP_PUSH',
  RECORD_AUDIO = 'android.permission.RECORD_AUDIO',
  REORDER_TASKS = 'android.permission.REORDER_TASKS',
  RESTART_PACKAGES = 'android.permission.RESTART_PACKAGES',
  SEND_RESPOND_VIA_MESSAGE = 'android.permission.SEND_RESPOND_VIA_MESSAGE',
  SEND_SMS = 'android.permission.SEND_SMS',
  SET_ACTIVITY_WATCHER = 'android.permission.SET_ACTIVITY_WATCHER',
  SET_ALARM = 'com.android.alarm.permission.SET_ALARM',
  SET_ALWAYS_FINISH = 'android.permission.SET_ALWAYS_FINISH',
  SET_ANIMATION_SCALE = 'android.permission.SET_ANIMATION_SCALE',
  SET_DEBUG_APP = 'android.permission.SET_DEBUG_APP',
  SET_ORIENTATION = 'android.permission.SET_ORIENTATION',
  SET_POINTER_SPEED = 'android.permission.SET_POINTER_SPEED',
  SET_PREFERRED_APPLICATIONS = 'android.permission.SET_PREFERRED_APPLICATIONS',
  SET_PROCESS_LIMIT = 'android.permission.SET_PROCESS_LIMIT',
  SET_TIME = 'android.permission.SET_TIME',
  SET_TIME_ZONE = 'android.permission.SET_TIME_ZONE',
  SET_WALLPAPER = 'android.permission.SET_WALLPAPER',
  SET_WALLPAPER_HINTS = 'android.permission.SET_WALLPAPER_HINTS',
  SIGNAL_PERSISTENT_PROCESSES = 'android.permission.SIGNAL_PERSISTENT_PROCESSES',
  STATUS_BAR = 'android.permission.STATUS_BAR',
  SUBSCRIBED_FEEDS_READ = 'android.permission.SUBSCRIBED_FEEDS_READ',
  SUBSCRIBED_FEEDS_WRITE = 'android.permission.SUBSCRIBED_FEEDS_WRITE',
  SYSTEM_ALERT_WINDOW = 'android.permission.SYSTEM_ALERT_WINDOW',
  TRANSMIT_IR = 'android.permission.TRANSMIT_IR',
  UNINSTALL_SHORTCUT = 'com.android.launcher.permission.UNINSTALL_SHORTCUT',
  UPDATE_DEVICE_STATS = 'android.permission.UPDATE_DEVICE_STATS',
  USE_CREDENTIALS = 'android.permission.USE_CREDENTIALS',
  USE_SIP = 'android.permission.USE_SIP',
  VIBRATE = 'android.permission.VIBRATE',
  WAKE_LOCK = 'android.permission.WAKE_LOCK',
  WRITE_APN_SETTINGS = 'android.permission.WRITE_APN_SETTINGS',
  WRITE_CALENDAR = 'android.permission.WRITE_CALENDAR',
  WRITE_CALL_LOG = 'android.permission.WRITE_CALL_LOG',
  WRITE_CONTACTS = 'android.permission.WRITE_CONTACTS',
  WRITE_EXTERNAL_STORAGE = 'android.permission.WRITE_EXTERNAL_STORAGE',
  WRITE_GSERVICES = 'android.permission.WRITE_GSERVICES',
  WRITE_HISTORY_BOOKMARKS = 'com.android.browser.permission.WRITE_HISTORY_BOOKMARKS',
  WRITE_PROFILE = 'android.permission.WRITE_PROFILE',
  WRITE_SECURE_SETTINGS = 'android.permission.WRITE_SECURE_SETTINGS',
  WRITE_SETTINGS = 'android.permission.WRITE_SETTINGS',
  WRITE_SMS = 'android.permission.WRITE_SMS',
  WRITE_SOCIAL_STREAM = 'android.permission.WRITE_SOCIAL_STREAM',
  WRITE_SYNC_SETTINGS = 'android.permission.WRITE_SYNC_SETTINGS',
  WRITE_USER_DICTIONARY = 'android.permission.WRITE_USER_DICTIONARY',
  WRITE_VOICEMAIL = 'com.android.voicemail.permission.WRITE_VOICEMAIL',
}

interface Permissions {
  ACCESS_CHECKIN_PROPERTIES: AndroidPermissions.ACCESS_CHECKIN_PROPERTIES
  ACCESS_COARSE_LOCATION: AndroidPermissions.ACCESS_COARSE_LOCATION
  ACCESS_FINE_LOCATION: AndroidPermissions.ACCESS_FINE_LOCATION
  ACCESS_LOCATION_EXTRA_COMMANDS: AndroidPermissions.ACCESS_LOCATION_EXTRA_COMMANDS
  ACCESS_MOCK_LOCATION: AndroidPermissions.ACCESS_MOCK_LOCATION
  ACCESS_NETWORK_STATE: AndroidPermissions.ACCESS_NETWORK_STATE
  ACCESS_SURFACE_FLINGER: AndroidPermissions.ACCESS_SURFACE_FLINGER
  ACCESS_WIFI_STATE: AndroidPermissions.ACCESS_WIFI_STATE
  ACCOUNT_MANAGER: AndroidPermissions.ACCOUNT_MANAGER
  ADD_VOICEMAIL: AndroidPermissions.ADD_VOICEMAIL
  AUTHENTICATE_ACCOUNTS: AndroidPermissions.AUTHENTICATE_ACCOUNTS
  BATTERY_STATS: AndroidPermissions.BATTERY_STATS
  BIND_ACCESSIBILITY_SERVICE: AndroidPermissions.BIND_ACCESSIBILITY_SERVICE
  BIND_APPWIDGET: AndroidPermissions.BIND_APPWIDGET
  BIND_CARRIER_MESSAGING_SERVICE: AndroidPermissions.BIND_CARRIER_MESSAGING_SERVICE
  BIND_DEVICE_ADMIN: AndroidPermissions.BIND_DEVICE_ADMIN
  BIND_DREAM_SERVICE: AndroidPermissions.BIND_DREAM_SERVICE
  BIND_INPUT_METHOD: AndroidPermissions.BIND_INPUT_METHOD
  BIND_NFC_SERVICE: AndroidPermissions.BIND_NFC_SERVICE
  BIND_NOTIFICATION_LISTENER_SERVICE: AndroidPermissions.BIND_NOTIFICATION_LISTENER_SERVICE
  BIND_PRINT_SERVICE: AndroidPermissions.BIND_PRINT_SERVICE
  BIND_REMOTEVIEWS: AndroidPermissions.BIND_REMOTEVIEWS
  BIND_TEXT_SERVICE: AndroidPermissions.BIND_TEXT_SERVICE
  BIND_TV_INPUT: AndroidPermissions.BIND_TV_INPUT
  BIND_VOICE_INTERACTION: AndroidPermissions.BIND_VOICE_INTERACTION
  BIND_VPN_SERVICE: AndroidPermissions.BIND_VPN_SERVICE
  BIND_WALLPAPER: AndroidPermissions.BIND_WALLPAPER
  BLUETOOTH: AndroidPermissions.BLUETOOTH
  BLUETOOTH_ADMIN: AndroidPermissions.BLUETOOTH_ADMIN
  BLUETOOTH_PRIVILEGED: AndroidPermissions.BLUETOOTH_PRIVILEGED
  BODY_SENSORS: AndroidPermissions.BODY_SENSORS
  BRICK: AndroidPermissions.BRICK
  BROADCAST_PACKAGE_REMOVED: AndroidPermissions.BROADCAST_PACKAGE_REMOVED
  BROADCAST_SMS: AndroidPermissions.BROADCAST_SMS
  BROADCAST_STICKY: AndroidPermissions.BROADCAST_STICKY
  BROADCAST_WAP_PUSH: AndroidPermissions.BROADCAST_WAP_PUSH
  CALL_PHONE: AndroidPermissions.CALL_PHONE
  CALL_PRIVILEGED: AndroidPermissions.CALL_PRIVILEGED
  CAMERA: AndroidPermissions.CAMERA
  CAPTURE_AUDIO_OUTPUT: AndroidPermissions.CAPTURE_AUDIO_OUTPUT
  CAPTURE_SECURE_VIDEO_OUTPUT: AndroidPermissions.CAPTURE_SECURE_VIDEO_OUTPUT
  CAPTURE_VIDEO_OUTPUT: AndroidPermissions.CAPTURE_VIDEO_OUTPUT
  CHANGE_COMPONENT_ENABLED_STATE: AndroidPermissions.CHANGE_COMPONENT_ENABLED_STATE
  CHANGE_CONFIGURATION: AndroidPermissions.CHANGE_CONFIGURATION
  CHANGE_NETWORK_STATE: AndroidPermissions.CHANGE_NETWORK_STATE
  CHANGE_WIFI_MULTICAST_STATE: AndroidPermissions.CHANGE_WIFI_MULTICAST_STATE
  CHANGE_WIFI_STATE: AndroidPermissions.CHANGE_WIFI_STATE
  CLEAR_APP_CACHE: AndroidPermissions.CLEAR_APP_CACHE
  CLEAR_APP_USER_DATA: AndroidPermissions.CLEAR_APP_USER_DATA
  CONTROL_LOCATION_UPDATES: AndroidPermissions.CONTROL_LOCATION_UPDATES
  DELETE_CACHE_FILES: AndroidPermissions.DELETE_CACHE_FILES
  DELETE_PACKAGES: AndroidPermissions.DELETE_PACKAGES
  DEVICE_POWER: AndroidPermissions.DEVICE_POWER
  DIAGNOSTIC: AndroidPermissions.DIAGNOSTIC
  DISABLE_KEYGUARD: AndroidPermissions.DISABLE_KEYGUARD
  DUMP: AndroidPermissions.DUMP
  EXPAND_STATUS_BAR: AndroidPermissions.EXPAND_STATUS_BAR
  FACTORY_TEST: AndroidPermissions.FACTORY_TEST
  FLASHLIGHT: AndroidPermissions.FLASHLIGHT
  FORCE_BACK: AndroidPermissions.FORCE_BACK
  GET_ACCOUNTS: AndroidPermissions.GET_ACCOUNTS
  GET_PACKAGE_SIZE: AndroidPermissions.GET_PACKAGE_SIZE
  GET_TASKS: AndroidPermissions.GET_TASKS
  GET_TOP_ACTIVITY_INFO: AndroidPermissions.GET_TOP_ACTIVITY_INFO
  GLOBAL_SEARCH: AndroidPermissions.GLOBAL_SEARCH
  HARDWARE_TEST: AndroidPermissions.HARDWARE_TEST
  INJECT_EVENTS: AndroidPermissions.INJECT_EVENTS
  INSTALL_LOCATION_PROVIDER: AndroidPermissions.INSTALL_LOCATION_PROVIDER
  INSTALL_PACKAGES: AndroidPermissions.INSTALL_PACKAGES
  INSTALL_SHORTCUT: AndroidPermissions.INSTALL_SHORTCUT
  INTERNAL_SYSTEM_WINDOW: AndroidPermissions.INTERNAL_SYSTEM_WINDOW
  INTERNET: AndroidPermissions.INTERNET
  KILL_BACKGROUND_PROCESSES: AndroidPermissions.KILL_BACKGROUND_PROCESSES
  LOCATION_HARDWARE: AndroidPermissions.LOCATION_HARDWARE
  MANAGE_ACCOUNTS: AndroidPermissions.MANAGE_ACCOUNTS
  MANAGE_APP_TOKENS: AndroidPermissions.MANAGE_APP_TOKENS
  MANAGE_DOCUMENTS: AndroidPermissions.MANAGE_DOCUMENTS
  MASTER_CLEAR: AndroidPermissions.MASTER_CLEAR
  MEDIA_CONTENT_CONTROL: AndroidPermissions.MEDIA_CONTENT_CONTROL
  MODIFY_AUDIO_SETTINGS: AndroidPermissions.MODIFY_AUDIO_SETTINGS
  MODIFY_PHONE_STATE: AndroidPermissions.MODIFY_PHONE_STATE
  MOUNT_FORMAT_FILESYSTEMS: AndroidPermissions.MOUNT_FORMAT_FILESYSTEMS
  MOUNT_UNMOUNT_FILESYSTEMS: AndroidPermissions.MOUNT_UNMOUNT_FILESYSTEMS
  NFC: AndroidPermissions.NFC
  PERSISTENT_ACTIVITY: AndroidPermissions.PERSISTENT_ACTIVITY
  PROCESS_OUTGOING_CALLS: AndroidPermissions.PROCESS_OUTGOING_CALLS
  READ_CALENDAR: AndroidPermissions.READ_CALENDAR
  READ_CALL_LOG: AndroidPermissions.READ_CALL_LOG
  READ_CONTACTS: AndroidPermissions.READ_CONTACTS
  READ_EXTERNAL_STORAGE: AndroidPermissions.READ_EXTERNAL_STORAGE
  READ_FRAME_BUFFER: AndroidPermissions.READ_FRAME_BUFFER
  READ_HISTORY_BOOKMARKS: AndroidPermissions.READ_HISTORY_BOOKMARKS
  READ_INPUT_STATE: AndroidPermissions.READ_INPUT_STATE
  READ_LOGS: AndroidPermissions.READ_LOGS
  READ_PHONE_STATE: AndroidPermissions.READ_PHONE_STATE
  READ_PROFILE: AndroidPermissions.READ_PROFILE
  READ_SMS: AndroidPermissions.READ_SMS
  READ_SOCIAL_STREAM: AndroidPermissions.READ_SOCIAL_STREAM
  READ_SYNC_SETTINGS: AndroidPermissions.READ_SYNC_SETTINGS
  READ_SYNC_STATS: AndroidPermissions.READ_SYNC_STATS
  READ_USER_DICTIONARY: AndroidPermissions.READ_USER_DICTIONARY
  READ_VOICEMAIL: AndroidPermissions.READ_VOICEMAIL
  REBOOT: AndroidPermissions.REBOOT
  RECEIVE_BOOT_COMPLETED: AndroidPermissions.RECEIVE_BOOT_COMPLETED
  RECEIVE_MMS: AndroidPermissions.RECEIVE_MMS
  RECEIVE_SMS: AndroidPermissions.RECEIVE_SMS
  RECEIVE_WAP_PUSH: AndroidPermissions.RECEIVE_WAP_PUSH
  RECORD_AUDIO: AndroidPermissions.RECORD_AUDIO
  REORDER_TASKS: AndroidPermissions.REORDER_TASKS
  RESTART_PACKAGES: AndroidPermissions.RESTART_PACKAGES
  SEND_RESPOND_VIA_MESSAGE: AndroidPermissions.SEND_RESPOND_VIA_MESSAGE
  SEND_SMS: AndroidPermissions.SEND_SMS
  SET_ACTIVITY_WATCHER: AndroidPermissions.SET_ACTIVITY_WATCHER
  SET_ALARM: AndroidPermissions.SET_ALARM
  SET_ALWAYS_FINISH: AndroidPermissions.SET_ALWAYS_FINISH
  SET_ANIMATION_SCALE: AndroidPermissions.SET_ANIMATION_SCALE
  SET_DEBUG_APP: AndroidPermissions.SET_DEBUG_APP
  SET_ORIENTATION: AndroidPermissions.SET_ORIENTATION
  SET_POINTER_SPEED: AndroidPermissions.SET_POINTER_SPEED
  SET_PREFERRED_APPLICATIONS: AndroidPermissions.SET_PREFERRED_APPLICATIONS
  SET_PROCESS_LIMIT: AndroidPermissions.SET_PROCESS_LIMIT
  SET_TIME: AndroidPermissions.SET_TIME
  SET_TIME_ZONE: AndroidPermissions.SET_TIME_ZONE
  SET_WALLPAPER: AndroidPermissions.SET_WALLPAPER
  SET_WALLPAPER_HINTS: AndroidPermissions.SET_WALLPAPER_HINTS
  SIGNAL_PERSISTENT_PROCESSES: AndroidPermissions.SIGNAL_PERSISTENT_PROCESSES
  STATUS_BAR: AndroidPermissions.STATUS_BAR
  SUBSCRIBED_FEEDS_READ: AndroidPermissions.SUBSCRIBED_FEEDS_READ
  SUBSCRIBED_FEEDS_WRITE: AndroidPermissions.SUBSCRIBED_FEEDS_WRITE
  SYSTEM_ALERT_WINDOW: AndroidPermissions.SYSTEM_ALERT_WINDOW
  TRANSMIT_IR: AndroidPermissions.TRANSMIT_IR
  UNINSTALL_SHORTCUT: AndroidPermissions.UNINSTALL_SHORTCUT
  UPDATE_DEVICE_STATS: AndroidPermissions.UPDATE_DEVICE_STATS
  USE_CREDENTIALS: AndroidPermissions.USE_CREDENTIALS
  USE_SIP: AndroidPermissions.USE_SIP
  VIBRATE: AndroidPermissions.VIBRATE
  WAKE_LOCK: AndroidPermissions.WAKE_LOCK
  WRITE_APN_SETTINGS: AndroidPermissions.WRITE_APN_SETTINGS
  WRITE_CALENDAR: AndroidPermissions.WRITE_CALENDAR
  WRITE_CALL_LOG: AndroidPermissions.WRITE_CALL_LOG
  WRITE_CONTACTS: AndroidPermissions.WRITE_CONTACTS
  WRITE_EXTERNAL_STORAGE: AndroidPermissions.WRITE_EXTERNAL_STORAGE
  WRITE_GSERVICES: AndroidPermissions.WRITE_GSERVICES
  WRITE_HISTORY_BOOKMARKS: AndroidPermissions.WRITE_HISTORY_BOOKMARKS
  WRITE_PROFILE: AndroidPermissions.WRITE_PROFILE
  WRITE_SECURE_SETTINGS: AndroidPermissions.WRITE_SECURE_SETTINGS
  WRITE_SETTINGS: AndroidPermissions.WRITE_SETTINGS
  WRITE_SMS: AndroidPermissions.WRITE_SMS
  WRITE_SOCIAL_STREAM: AndroidPermissions.WRITE_SOCIAL_STREAM
  WRITE_SYNC_SETTINGS: AndroidPermissions.WRITE_SYNC_SETTINGS
  WRITE_USER_DICTIONARY: AndroidPermissions.WRITE_USER_DICTIONARY
  WRITE_VOICEMAIL: AndroidPermissions.WRITE_VOICEMAIL

  checkPermission(
    permission: AndroidPermissions,
    success?: (status: { hasPermission: boolean }) => void,
    error?: () => void
  ): void

  requestPermission(
    permission: AndroidPermissions,
    success?: (status: { hasPermission: boolean }) => void,
    error?: () => void
  ): void

  requestPermissions(
    permissions: AndroidPermissions[],
    success?: (status: { hasPermission: boolean }) => void,
    error?: () => void
  ): void
}

interface CordovaPlugins {
  permissions: Permissions
}
