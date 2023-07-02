#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <GoogleMaps/GoogleMaps.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTBridge.h>
#import <React/RCTRootView.h>
#import <React/RCTBundleURLProvider.h>
#import <CoreLocation/CoreLocation.h> // Import the CoreLocation framework

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"LocationApp";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  // Add the following lines with your Google Maps API key
  [GMSServices provideAPIKey:@"AIzaSyCQAHvArVBuYhlopwlU5fDDXPI0TNdYGrw"];
  
  // Request location permission
  if ([CLLocationManager locationServicesEnabled]) {
    [CLLocationManager requestWhenInUseAuthorization];
  }
  
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
