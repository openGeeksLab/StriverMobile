
import React, {Component} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  AsyncStorage,
  KeyboardAvoidingView,
  NetInfo,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableHighlight
} from 'react-native';
import Display from 'react-native-display';
import BackgroundTimer from 'react-native-background-timer';
import moment from 'moment';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import preciseDiff from 'moment-precise-range-plugin';
import {
  MKTextField,
  MKColor,
  MKButton,
  mdl,
  getTheme,
} from 'react-native-material-kit';
import * as auth0 from '../../services/auth0';
import { regular, bold, medium} from 'AppFonts';

const { width, height } = Dimensions.get('window');
const theme = getTheme();
const testConnectionListenerWorking = false;
var endWorkoutTime = "";
var startWorkoutTime = "";

const styles = StyleSheet.create({
  container: {
    width,
    height,
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  viewFinish: {
    paddingTop: Platform.OS === 'android' ? 0 : 25,
    backgroundColor: '#a3a3a3',
  },
  viewIntensityScore: {
    width: (width - 60),
    marginTop: 30,
    marginLeft: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewFocusScore: {
    width: (width - 60),
    marginTop: 10,
    marginLeft: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textIntensityScore: {
    color: '#ececec',
    fontSize: 18,
    fontFamily: bold,
  },
  viewFocusScoreText: {
    width: (width - 120),
    justifyContent: 'center',
  },
  viewIntensityScoreText: {
    width: (width - 120),
    justifyContent: 'center',
  },
  inputIntencityScore: {
    height: 30,
    width: 60,
  },
  inputTextComments: {
    marginTop: 5,
    // flex: 1,
    height: 39,
  },
  viewTime: {
    marginTop: 10,
    marginLeft: 30,
  },
  textFinish: {
    color: 'white',
    fontFamily: bold,
    fontSize: 14,
    backgroundColor: 'transparent',
  },
  viewFinishButton: {
    marginTop: 20,
   flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 20,
  },
  viewInputScore: {
    justifyContent: 'center',
  },
  viewError: {
    width: (width - 60),
    marginTop: 3,
    marginLeft: 30,
    alignItems: 'flex-end'
  },
  textError: {
    fontSize: 16,
    color: 'red',
    fontWeight: '600',
    fontFamily: medium,
  },

  button: {
    paddingHorizontal: 18,
    height: 36,
    width: (width / 2) - 15,
  },

  viewComments: {
    marginLeft: 30,
    width: (width - 60),
    marginTop: 20,
  }
});

const TextfieldScore = MKTextField.textfield()
  .withStyle(styles.inputIntencityScore)
  .withTextInputStyle({
    flex: 1,
    backgroundColor: '#a3a3a3',
    color: '#ececec',
    fontFamily: medium,
    fontSize: 16,
    textAlign: 'center'
  })
  .withTintColor('#ececec')
  .withHighlightColor('#409ac9')
  .build();

const TextfieldComment = MKTextField.textfield()
  .withStyle(styles.inputTextComments)
  .withTextInputStyle({
    flex: 1,
    backgroundColor: '#a3a3a3',
    paddingTop: -5,
    fontFamily: medium,
    color: '#ececec',
    fontSize: 16,
    textAlignVertical: 'bottom'
  })
  .withTintColor('#ececec')
  .withHighlightColor('#409ac9')
  .build();

class LiveWorkoutFinishWindow extends Component {

componentWillReceiveProps(nextProps)
{
  if (nextProps.windowFinishVisible) {
    AsyncStorage.getItem('endWorkoutTime')
      .then((asyncEndWorkoutTime) => {
        endWorkoutTime = asyncEndWorkoutTime;
      })
      .catch(error => console.log('error in AsyncStorage.getItem(\'endWorkoutTime\'): ', error));
    AsyncStorage.getItem('beginWorkoutTime')
      .then((asyncStartWorkoutTime) => {
        startWorkoutTime = asyncStartWorkoutTime;
        let getWorkoutDuration = moment(startWorkoutTime).preciseDiff(endWorkoutTime);
        this.setState({workoutDuration: getWorkoutDuration})
      })
      .catch(error => console.log('error in AsyncStorage.getItem(\'startWorkoutTime\'): ', error));
  }
}
  state={
      intensityScoreText: '',
      focusScoreText: '',
      comments: '',
      errorIntensityScore: '',
      errorFocusScore: '',
      errorComents: '',
      scroll: false,
      workoutDuration: null,
      loadResult: false}

  setModalVisible(visible){
    //this.setState({modalVisible:visible});
   this.props.closeWindowFinish()
  }
  getHeight = () => {
    if (this.props.windowFinishVisible) {
      return height;
    }
    return 0;
  }

  onFinish = () => {
    const {intensityScoreText, focusScoreText, comments, errorIntensityScore, errorFocusScore, errorComents} = this.state;
    if (errorIntensityScore.length === 0 && errorFocusScore.length === 0 && errorComents.length === 0) {
      this.handleFinishPress();
    }
  }

  handleFinishPress = () => {
    let sendStartTime = moment(startWorkoutTime).format("YYYY-DD-MM[T]HH:mm:ss");
    let sendEndTime = moment(endWorkoutTime).format("YYYY-DD-MM[T]HH:mm:ss");
    var resultObject = JSON.stringify({
      "athleteId": this.props.nextWorkoutTree.athleteId, //athlete user ID  (guid)
      "athleteWorkoutId": this.props.nextWorkoutTree.athleteWorkoutId, //grab from workout
      "athleteProgramId": this.props.nextWorkoutTree.athleteProgramId, //grab from workout
      "PerceivedIntensityScore": Number(this.state.intensityScoreText), //scaled 1-10
      "PerceivedFocusScore": Number(this.state.focusScoreText), //scaled 1-10
      "Notes": this.state.comments, //string
      "StartTime": sendStartTime, //start of timer
      "EndTime": sendEndTime, //end of timer
    });

    NetInfo.isConnected.fetch().done((reach_bool) => { //checking Internet connection
      if (reach_bool == true) { // if  device connected to Internet send Workout result to server
        this.sendingWorkoutResult(resultObject);
      } else { //if there is no Internet connection, save Workout result to AsyncStorage
        AsyncStorage.setItem('resultObject', resultObject);
        if (!testConnectionListenerWorking) {
          testConnectionListenerWorking = true;
            NetInfo.addEventListener( // creating listener on connection changing
              'change',
              this.handleConnectivityChange
            );
            checkListener = BackgroundTimer.setInterval(() => {
              console.warn('Internet connection checking');
            }, 1000);
        };
        Alert.alert(
          'No Internet Connection',
          'Unable to send workout result. Please check your Internet connection. Don\'t start next workout before StriverMobile will send previous one after getting connection.',
          [
            {text: 'OK', onPress: () => {}},
          ],
          { cancelable: false }
        )
      }
    });
  }

  handleConnectivityChange = (reach) => {
    const isConnected = ((reach.toLowerCase() !== 'none') && (reach.toLowerCase() !== 'unknown'));
    if (isConnected) {
      AsyncStorage.getItem('resultObject')
        .then((savedResultObject) => {
          AsyncStorage.removeItem('resultObject')
          .catch(error => console.log('error AsyncStorage.removeItem(\'resultObject\'): ', error));
          this.sendingWorkoutResult(savedResultObject);
        })
        .catch(error => console.log('error AsyncStorage.getItem(\'resultObject\'): ', error));
      testConnectionListenerWorking = false;
      NetInfo.removeEventListener( //turning off connection listener
        'change',
        this.handleConnectivityChange
      );
      BackgroundTimer.clearInterval(checkListener);
    }
  };

  sendingWorkoutResult = (resultObject) => {
    this.setState({
      loadResult: true
    });
    fetch('https://strivermobile-api.herokuapp.com/api/workoutcomplete',{
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + this.props.nextWorkoutToken,
        'Content-Type': 'application/json',
      },
      body: resultObject
    })
    .then((response) => {
      if ((response.status == 401) && (response.ok == false)  && (response._bodyText === 'Unauthorized', '\\n')) {
        this.setState({
          loadResult: false
        });
        auth0.showLogin()
          .catch(e => console.log('error in showLogin()', e));
      } else if (response.status === 200 && response.ok === true) { //checking server response on failing
        Alert.alert(
          'Send Success',
          'Workout result was sent successfully.',
          [
            {text: 'OK', onPress: () => {}},
          ],
          { cancelable: true }
        )
        this.setState({
          loadResult: false,
        });
        this.props.popToStartScreen();
        this.props.closeWindowFinish();
        this.props.clearCheck();
      } else { // in case of "not ok" server response, saving Workout result to AsyncStorage and trying to attempt
        AsyncStorage.setItem('resultObject', resultObject);
        Alert.alert(
          'Bad server respond',
          'Unable to Save Workout At This Time.',
          [
            {text: 'OK', onPress: () => {}},
          ],
          { cancelable: false }
        )
        console.log('There is something wrong. Server response: ', response);
      }
    })
    .catch((e) => {
      AsyncStorage.setItem('resultObject', resultObject);
      console.log('error in first POST request: ', e);
    });
  }

  setIntensityScore = (text) => {
    this.setState({intensityScoreText: text});
    if (text.length > 0) {
      if (Number(text) > 0 && Number(text) < 11) {
        this.setState({errorIntensityScore: ''});
      } else {
        this.setState({errorIntensityScore: 'Must be from 1 to 10.'});
      }
    } else {
      this.setState({errorIntensityScore: ''});
    }
  }

  setFocusScore = (text) => {
    this.setState({focusScoreText: text});
    if (text.length > 0) {
      if (Number(text) > 0 && Number(text) < 11) {
        this.setState({errorFocusScore: ''});
      } else {
        this.setState({errorFocusScore: 'Must be from 1 to 10.'});
      }
    } else {
      this.setState({errorFocusScore: ''});
    }
  }

  setComments = (text) => {
    this.setState({
      comments: text,
      errorComents: '',
    });
  }

  checkEnableFinishButton = () => {
    const {
      intensityScoreText,
      focusScoreText,
      comments,
      errorIntensityScore,
      errorFocusScore,
      errorComents
    } = this.state;
    if (intensityScoreText.length > 0 && focusScoreText.length > 0 && comments.length > 0 && errorIntensityScore.length <= 0 && errorFocusScore.length <= 0 && errorComents.length <= 0) {
      return false;
    }
    return true;
  }

  renderFinishButton = () => {
    const FinishButton = MKButton.button()
      .withBackgroundColor(this.checkEnableFinishButton() ? 'rgba(0,0,0,0.12)' : MKColor.Blue)
      .withStyle([styles.button, this.checkEnableFinishButton() && {shadowRadius: 1, elevation: 2}])
      .build();
    return (
      <FinishButton disabled={this.checkEnableFinishButton() || this.state.loadResult} onPress={() => {this.onFinish()}}>
        {
          this.state.loadResult
          ?
            <ActivityIndicator size={Platform.OS === 'android' ? 20 : "small"} color={'white'} />
          :
            <Text style={[
              styles.textFinish,
              this.checkEnableFinishButton()
                ? {color: 'rgba(0,0,0,0.26)', shadowRadius: 0, elevation: 0}
                : {color: 'white'}
            ]}>
              Finish
            </Text>
        }
      </FinishButton>
    )
  }

  render() {
    // console.warn(JSON.stringify(theme, null, 2));
    const { windowFinishVisible } = this.props;
    return (
    <View style={{ position: 'absolute', width, height: this.getHeight() }}>
      <Modal
        animationType={"slide"}
        transparent={false}
        visible={windowFinishVisible}
        onRequestClose={() => {
          this.setModalVisible(false);
        }}
      >
        <View style={{marginTop: 22}}>
        <View style={[styles.container, {backgroundColor: 'red'}]} />
          <View style={{backgroundColor: 'green', width: width - 30, height: 400}}>
          {//delete this View, when finish Material Card adding
          }
          <View style={[theme.cardStyle, {width: width - 30}]}>
            {//<Text style={[theme.cardTitleStyle, {position: 'relative'}]}>Welcome</Text>
          }
            <KeyboardAvoidingView
              behavior={'padding'}
              style={styles.viewFinish}
            >
              <View style={styles.viewIntensityScore}>
                <View style={styles.viewIntensityScoreText}>
                  <Text style={styles.textIntensityScore}>
                    Intensity Score (1-10):
                  </Text>
                </View>
                <View style={styles.viewInputScore}>
                  <TextfieldScore
                    onChangeText={this.setIntensityScore}
                    value={this.state.intensityScoreText}
                    maxLength={2}
                    selectionColor={'#409ac9'}
                    keyboardType="numeric"
                    underlineSize={3}
                    underlineColorAndroid="transparent"
                    onFocus={() => {this.setState({scroll: true})}}
                    onBlur={() => {this.setState({scroll: false})}}
                  />
                </View>
              </View>
              <View style={styles.viewError}>
                {
                  this.state.errorIntensityScore !== '' &&

                  <Text style={styles.textError}>
                    {this.state.errorIntensityScore}
                  </Text>
                }
              </View>
              <View style={styles.viewFocusScore}>
                <View style={styles.viewFocusScoreText}>
                  <Text style={styles.textIntensityScore}>
                    Focus Score (1-10):
                  </Text>
                </View>
                <View style={styles.viewInputScore}>
                  <TextfieldScore
                    onChangeText={this.setFocusScore}
                    value={this.state.focusScoreText}
                    maxLength={2}
                    keyboardType="numeric"
                    underlineSize={3}
                    selectionColor={'#409ac9'}
                    underlineColorAndroid="transparent"
                    onFocus={() => {this.setState({scroll: true})}}
                    onBlur={() => {this.setState({scroll: false})}}
                  />
                </View>
              </View>
              <View style={styles.viewError}>
                {
                  this.state.errorFocusScore !== '' &&

                  <Text style={styles.textError}>
                    {this.state.errorFocusScore}
                  </Text>
                }
              </View>
              <View style={styles.viewComments}>
                <Text style={styles.textIntensityScore}>
                  Comments:
                </Text>
                <View>
                  <TextfieldComment
                    onChangeText={this.setComments}
                    value={this.state.comments}
                    multiline
                    underlineSize={3}
                    autoCorrect={false}
                    selectionColor={'#409ac9'}
                    underlineColorAndroid="transparent"
                    onFocus={() => {this.setState({scroll: true})}}
                    onBlur={() => {this.setState({scroll: false})}}
                  />
                </View>
              </View>



            </KeyboardAvoidingView>
            <KeyboardSpacer topSpacing={Platform.OS === 'android' ? 80 : 20} />


            <Text style={theme.cardContentStyle}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Mauris sagittis pellentesque lacus eleifend lacinia...
            </Text>
            {//<View style={theme.cardMenuStyle}>
              //<Text>Menu</Text>
            //</View>
            }
            <Text style={theme.cardActionStyle}>My Action</Text>
          </View>
          </View>
          {//delete this View, when finish Material Card adding
          }
          <ScrollView scrollEnabled={this.state.scroll ? true : false }>
            <KeyboardAvoidingView
              behavior={'padding'}
              style={styles.viewFinish}
            >
              <View style={styles.viewIntensityScore}>
                <View style={styles.viewIntensityScoreText}>
                  <Text style={styles.textIntensityScore}>
                    Intensity Score (1-10):
                  </Text>
                </View>
                <View style={styles.viewInputScore}>
                  <TextfieldScore
                    onChangeText={this.setIntensityScore}
                    value={this.state.intensityScoreText}
                    maxLength={2}
                    selectionColor={'#409ac9'}
                    keyboardType="numeric"
                    underlineSize={3}
                    underlineColorAndroid="transparent"
                    onFocus={() => {this.setState({scroll: true})}}
                    onBlur={() => {this.setState({scroll: false})}}
                  />
                </View>
              </View>
              <View style={styles.viewError}>
                {
                  this.state.errorIntensityScore !== '' &&

                  <Text style={styles.textError}>
                    {this.state.errorIntensityScore}
                  </Text>
                }
              </View>
              <View style={styles.viewFocusScore}>
                <View style={styles.viewFocusScoreText}>
                  <Text style={styles.textIntensityScore}>
                    Focus Score (1-10):
                  </Text>
                </View>
                <View style={styles.viewInputScore}>
                  <TextfieldScore
                    onChangeText={this.setFocusScore}
                    value={this.state.focusScoreText}
                    maxLength={2}
                    keyboardType="numeric"
                    underlineSize={3}
                    selectionColor={'#409ac9'}
                    underlineColorAndroid="transparent"
                    onFocus={() => {this.setState({scroll: true})}}
                    onBlur={() => {this.setState({scroll: false})}}
                  />
                </View>
              </View>
              <View style={styles.viewError}>
                {
                  this.state.errorFocusScore !== '' &&

                  <Text style={styles.textError}>
                    {this.state.errorFocusScore}
                  </Text>
                }
              </View>
              <View style={styles.viewComments}>
                <Text style={styles.textIntensityScore}>
                  Comments:
                </Text>
                {
                  //**************************************************
                }
                <View>
                  <TextfieldComment
                    onChangeText={this.setComments}
                    value={this.state.comments}
                    multiline
                    underlineSize={3}
                    autoCorrect={false}
                    selectionColor={'#409ac9'}
                    underlineColorAndroid="transparent"
                    onFocus={() => {this.setState({scroll: true})}}
                    onBlur={() => {this.setState({scroll: false})}}
                  />
                </View>
              </View>
              <View style={styles.viewError}>
                {
                  this.state.errorComents !== '' &&
                  <Text style={styles.textError}>
                    {this.state.errorComents}
                  </Text>
                }
              </View>
              <View style={styles.viewTime}>
                <Text style={styles.textIntensityScore}>
                  Time: {this.state.workoutDuration}
                </Text>
              </View>
              <View style={styles.viewFinishButton}>
                <MKButton
                  backgroundColor={MKColor.Grey}
                  shadowColor="black"
                  style={[styles.button,{shadowRadius: 1, elevation: 2}]}
                  onPress={() => {
                    this.setModalVisible(false);
                  }}
                >
                  <Text style={[styles.textFinish,{color:'white'}]}>
                  Cancel
                  </Text>
                </MKButton>
                {this.renderFinishButton()}
              </View>

            </KeyboardAvoidingView>
            <KeyboardSpacer topSpacing={Platform.OS === 'android' ? 80 : 20} />
          </ScrollView>

        </View>
      </Modal>

    </View>
    );
  }
}

export default LiveWorkoutFinishWindow;
