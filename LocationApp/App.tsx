import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Switch, Button, Platform, Alert } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from 'react-native-get-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { LocationError } from 'react-native-get-location';
import AndroidOpenSettings from 'react-native-android-open-settings';


const App = () => {
  const [address, setAddress] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [DEFAULT_LATITUDE, setDefaultLatitude] = useState(null);
  const [DEFAULT_LONGITUDE, setDefaultLongitude] = useState(null);

  const toggleSwitch = () => {
    setUseCustomLocation((prevValue) => !prevValue);
  };

  const handleEnter = async () => {
    if (!address && !zipcode) {
      Alert.alert('Please enter an address or zip code.');
      return;
    }

    let permissionStatus = null;

    if (Platform.OS === 'android') {
      permissionStatus = await requestLocationPermissionAndroid();
      requestOverlayPermissionAndroid();
    } else if (Platform.OS === 'ios') {
      permissionStatus = await requestLocationPermissionIOS();
      requestOverlayPermissionIOS();
    }

    if (permissionStatus === RESULTS.GRANTED || !useCustomLocation) {
      let geocodingUrl = '';

      if (address) {
        geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=AIzaSyCQAHvArVBuYhlopwlU5fDDXPI0TNdYGrw`;
      } else if (zipcode) {
        geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          zipcode
        )}&key=AIzaSyCQAHvArVBuYhlopwlU5fDDXPI0TNdYGrw`;
      }

      fetch(geocodingUrl)
        .then((response) => response.json())
        .then((data) => {
          if (data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            setLatitude(lat);
            setLongitude(lng);
            spoofLocation(lat, lng); // Spoof the location here
          } else {
            Alert.alert('Unable to get precise location for the selected address or zip code.');
          }
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    } else {
      Alert.alert('Location permission denied. Please enable location permissions in settings.');
    }
  };

  const handleToggleLocation = () => {
    if (useCustomLocation) {
      setUseCustomLocation(false);
      restoreLocation(); // Restore the original location here
    } else {
      if (Platform.OS === 'android') {
        cancelLocationRequestAndroid();
        requestLocationPermissionAndroid().then((result) => {
          if (result === RESULTS.GRANTED) {
            getCurrentLocation();
            requestOverlayPermissionAndroid();
          } else {
            Alert.alert('Location permission denied. Please enable location permissions in settings.');
          }
        });
      } else if (Platform.OS === 'ios') {
        cancelLocationRequest();
        requestLocationPermissionIOS().then((result) => {
          if (result === RESULTS.GRANTED) {
            getCurrentLocation();
            requestOverlayPermissionIOS();
          } else {
            Alert.alert('Location permission denied. Please enable location permissions in settings.');
          }
        });
      }

      // Set the latitude and longitude based on the entered address
      if (address) {
        let geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=AIzaSyCQAHvArVBuYhlopwlU5fDDXPI0TNdYGrw`;

        fetch(geocodingUrl)
          .then((response) => response.json())
          .then((data) => {
            if (data.results.length > 0) {
              const { lat, lng } = data.results[0].geometry.location;
              setLatitude(lat);
              setLongitude(lng);
              spoofLocation(lat, lng); // Spoof the location here
            } else {
              Alert.alert('Unable to get precise location for the selected address.');
            }
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      }
    }
  };

  const requestLocationPermissionAndroid = async () => {
    const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    return result;
  };

  const requestLocationPermissionIOS = async () => {
    const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    return result;
  };

  const requestOverlayPermissionAndroid = async () => {
    // Request overlay permission for Android
    // This will allow your app to show things on top of other apps
    
    // Open the overlay settings page using `AndroidOpenSettings`
    AndroidOpenSettings.appOverlaySettings();
    
    // After the user grants or denies permission, you can check the result
    // using the `AndroidOpenSettings.canDrawOverlays()` method to verify the permission status
  };
  
  
  const requestOverlayPermissionIOS = async () => {
    // Request overlay permission for iOS
    // This will allow your app to show things on top of other apps
  
    // For iOS, you can use the `react-native-permissions` package to request the overlay permission
    // Here's an example using the `request` method from `react-native-permissions`:
    const { request } = require('react-native-permissions');
  
    // Request the overlay permission
    const result = await request('ios.permission.PRESENTATION_EXTENSION');
  
    // Check the permission result
    if (result === 'granted') {
      // Permission granted
      console.log('Overlay permission granted for iOS');
    } else {
      // Permission denied
      console.log('Overlay permission denied for iOS');
    }
  };
  
  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 80000,
    })
      .then((location) => {
        const { latitude, longitude } = location;
        setLatitude(latitude);
        setLongitude(longitude);
        spoofLocation(latitude, longitude); // Spoof the location here
      })
      .catch((error) => {
        if (error instanceof LocationError) {
          if (error.code === LocationError.TIMEOUT) {
            console.error('Location request timed out');
          } else if (error.code === LocationError.CANCELLED) {
            console.error('Location request cancelled by another request');
          } else {
            console.error('Location request failed with error:', error.message);
          }
        } else {
          console.error('Error:', error);
        }
      });
  };

  const cancelLocationRequest = () => {
    // TODO: Implement cancelling location request for iOS if needed
  };

  const cancelLocationRequestAndroid = () => {
    // TODO: Implement cancelling location request for Android if needed
  };

  useEffect(() => {
    // Check and request location permissions on app startup
    const checkLocationPermission = async () => {
      let permissionStatus = null;

      if (Platform.OS === 'android') {
        permissionStatus = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      } else if (Platform.OS === 'ios') {
        permissionStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      }

      if (permissionStatus === RESULTS.GRANTED) {
        setPermissionGranted(true);
        // Get the current location and set it as the default
        Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
        })
          .then((location) => {
            const { latitude, longitude } = location.coords;
            setDefaultLatitude(latitude);
            setDefaultLongitude(longitude);
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      }
    };

    checkLocationPermission();
  }, []);

  const spoofLocation = (lat, lng) => {
    // Implement location spoofing here based on the lat and lng
    if (Platform.OS === 'android') {
      // TODO: Implement location spoofing for Android
      // You will need appropriate permissions to do this
      // Use the lat and lng to set mock location for Android
    } else if (Platform.OS === 'ios') {
      // TODO: Implement location spoofing for iOS
      // This might involve injecting location data into specific APIs or system components
      // Use the lat and lng to set location for iOS
    }
  };

  const restoreLocation = () => {
    // Implement restoring the original location
    if (Platform.OS === 'android') {
      // TODO: Disable mock location mode for Android
      // You will need appropriate permissions to do this
    } else if (Platform.OS === 'ios') {
      // TODO: Implement restoring the original location for iOS
      // This might involve reverting any changes made to location data APIs or system components
    }
  };

  const handleShowLocation = () => {
    if (latitude !== null && longitude !== null) {
      Alert.alert(`Latitude: ${latitude}, Longitude: ${longitude}`);
    } else {
      if (Platform.OS === 'android') {
        requestLocationPermissionAndroid().then((result) => {
          if (result === RESULTS.GRANTED) {
            getCurrentLocation();
          } else {
            Alert.alert('Location permission denied. Please enable location permissions in settings.');
          }
        });
      } else if (Platform.OS === 'ios') {
        getCurrentLocation();
      }
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Enter Address:</Text>
      <GooglePlacesAutocomplete
        placeholder="E.g., 123 Main St, City, Country"
        onPress={(data, details = null) => {
          setAddress(data.description);
        }}
        query={{
          key: 'AIzaSyCQAHvArVBuYhlopwlU5fDDXPI0TNdYGrw',
          language: 'en',
          types: 'geocode',
        }}
        currentLocation={false}
        currentLocationLabel="Current location"
        styles={{
          container: {
            flex: 0,
            width: '80%',
          },
          textInput: {
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            marginBottom: 10,
            paddingHorizontal: 10,
          },
        }}
      />
      {!useCustomLocation && (
        <TextInput
          style={{
            height: 40,
            width: '80%',
            borderColor: 'gray',
            borderWidth: 1,
            marginBottom: 10,
            paddingHorizontal: 10,
          }}
          value={zipcode}
          onChangeText={(text) => setZipcode(text)}
          placeholder="Enter Zip Code"
        />
      )}
      <Button onPress={handleEnter} title="Enter" />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
        <Text>Use Custom Location:</Text>
        <Switch value={useCustomLocation} onValueChange={toggleSwitch} />
      </View>
      <Button
        onPress={handleToggleLocation}
        title={useCustomLocation ? 'Go Back to Regular' : 'Use Custom Location'}
      />
      <Button onPress={handleShowLocation} title="Show Location" />
      {latitude !== null && longitude !== null && (
        <Text style={{ marginTop: 20 }}>
          Latitude: {latitude}, Longitude: {longitude}
        </Text>
      )}

      {latitude !== null && longitude !== null && (
        <Text style={{ marginBottom: 20 }}>
          Current Location: {latitude}, {longitude}
        </Text>
      )}
    </View>
  );
};

export default App;
