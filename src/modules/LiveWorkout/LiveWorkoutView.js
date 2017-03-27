import React, { Component, PropTypes } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Dimensions,
  Image,
  TouchableOpacity,
  TouchableHighlight,
  ActivityIndicator,
} from 'react-native';
import CheckBox from 'react-native-checkbox';
import moment from 'moment';
import * as NavigationState from '../../modules/navigation/NavigationState';

import * as HomeState from '../Home/HomeState';
import * as LiveWorkoutState from './LiveWorkoutState';
import BackgroundTimer from 'react-native-background-timer';
import LiveWorkoutFinishWindow from './LiveWorkoutFinishWindow';
import NavButton from '../../components/NavButton';
import * as MK from 'react-native-material-kit';
import { regular, bold, medium} from 'AppFonts';

const { width, height } = Dimensions.get('window');
const pencil = require('../../assets/pencil.png');
const liveWorkoutTimer = 'workOutTimer';
const {
  MKButton,
  MKColor,
  MKCheckbox,
} = MK;

const styles = StyleSheet.create({
  viewContainer: {
    height: Platform.OS === 'android' ? (height - 105) : (height - 80),
    width,
  },
  container: {
    paddingTop: Platform.OS === 'android' ? 0 : 25,
    backgroundColor: 'white',
  },
  activityIndicator: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewHead: {
    paddingHorizontal: 40,
  },
  viewHeadItem: {
    height: 48,
    justifyContent: 'center',
  },
  textTop: {
    color: '#7b7b7b',
    fontSize: 20,
    fontFamily: bold,
  },
  viewTouchOpacityComplete: {
    width,
    alignItems: 'center',
  },
  completeWorkoutButton: {
    paddingHorizontal: 16,
    marginTop: 25,
  },
  textComplete: {
    fontSize: 15,
    color: '#7b7b7b',
    fontWeight: '600',
  },
  touchableItem: {
    paddingVertical: 10,
  },
  viewRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: (width - 30),
    alignItems: 'center',
  },
  viewItems: {
    marginTop: 30,
  },
  viewItem: {
    justifyContent: 'center',

    width: (width),
  },
  textExercizeName: {
    color: '#7b7b7b',
    fontSize: 17,
    width: (width / 1.4),
    fontFamily: bold
  },
  checkboxStyle: {
    tintColor: '#979797',
    borderWidth: 2.8,
    borderColor: '#979797',
    backgroundColor: '#ededed',
  },
  viewSetsFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: (width / 1.5),
  },
  viewSets: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 5,
  },
  textSets: {
    color: '#7b7b7b',
    fontSize: 16,
    fontFamily: bold
  },
  viewSetHead: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  viewFlexDirectionSet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: (width / 1.5),
  },
  viewSetsArray: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 5,
  },
  viewSetParam: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    marginTop: 5,
  },
  textSetParam: {
    color: '#7b7b7b',
    fontSize: 16,
  },
  textCompleteButton: {
    fontFamily: bold,
    fontSize: 14,
  },
});
const liveWorkoutComponents = [
  {
    sets: [
      {
        weight: 25,
        repetitions: 5,
        intervalTime: 35,
      },
      {
        weight: 30,
        repetitions: 4,
        intervalTime: 40,
      },
      {
        weight: 30,
        repetitions: 5,
        intervalTime: 50,
      },
    ],
  },
  {
    sets: [
      {
        weight: 4,
        repetitions: 15,
        intervalTime: 55,
      },
      {
        weight: 10,
        repetitions: 10,
        intervalTime: 50,
      },
      {
        weight: 15,
        repetitions: 5,
        intervalTime: 25,
      },
    ],
  },
  {
    sets: [
      {
        weight: 55,
        repetitions: 2,
        intervalTime: 10,
      },
      {
        weight: 70,
        repetitions: 1,
        intervalTime: 5,
      },
      {
        weight: 70,
        repetitions: 1,
        intervalTime: 5,
      },
    ],
  },
];

class LiveWorkout extends Component {
  componentDidMount(){
    let gotBeginWorkoutTime = moment().format("YYYY-DD-MM[T]HH:mm:ss");
    //starting timer
    this.props.dispatch(HomeState.getWorkoutTree());
    liveWorkoutTimer = BackgroundTimer.setInterval(() => {
      this.props.dispatch(HomeState.timerIncrement());
    }, 1000);
    this.setState({beginWorkoutTime: gotBeginWorkoutTime});
  }

  // componentWillMount() {
  //   this.props.dispatch(HomeState.getWorkoutTree());
  // }

  componentWillReceiveProps() {
    this.props.nextWorkoutTree.liveWorkoutComponents && this.setState({len: this.props.nextWorkoutTree.liveWorkoutComponents.length});
  }

  state={
    check: [],
    disable: true,
    len: 0,
    windowFinishVisible: false,
    beginWorkoutTime: null,
  }

  renderComleteWorkoutButton = () => {
    const CompleteWorkout = MKButton.coloredButton()
      .withBackgroundColor(this.check() ? 'rgba(0,0,0,0.12)' : MKColor.Blue)
      .withStyle([styles.completeWorkoutButton, {height: 36,}])
      .withShadowAniEnabled(this.check())
      .withTextStyle([styles.textCompleteButton, this.check() ? {color: 'rgba(0,0,0,0.26)', shadowRadius: 0, elevation: 0} : {color: 'white'}])
      .withText('Complete Workout')
      .build();
      return (
        <CompleteWorkout
          onPress={() => {this.setWindowFinishVisible()}}
          disabled={this.check()}
        />
      );
  }

  pop = (requestCheck) => {
    this.props.dispatch(NavigationState.popRoute());
    this.props.dispatch(HomeState.timerReset());
  }

  check = () => {
    let count = 0;
    for (let i=0; i<=this.state.len; i++) {
      if (this.props.check.get(i) !== undefined && this.props.check.get(i) === true) {
        count += 1;
      }
    }

    if (this.state.len > 0 && count === this.state.len) {
      return false;
    }
    return true;
    // return !(this.state.len > 0 && count === this.state.len);
  }

  setWindowFinishVisible = () => {
    this.setState({windowFinishVisible : !this.state.windowFinishVisible});
    BackgroundTimer.clearInterval(liveWorkoutTimer);
  }

  checkExsercise = (index) => {
    this.props.dispatch(LiveWorkoutState.setCheck(index));
  }

  clearCheck = () => {
    this.props.dispatch(LiveWorkoutState.clearCheck());
  }

  renderRow = (set) => {
    return (
      <View style={styles.viewFlexDirectionSet}>
        <View style={styles.viewSetParam}>
          <Text style={styles.textSetParam}>
            {set.weight}
          </Text>
        </View>
        <View style={styles.viewSetParam}>
          <Text style={styles.textSetParam}>
            {set.repetitions}
          </Text>
        </View>
        <View style={styles.viewSetParam}>
          <Text style={styles.textSetParam}>
            {set.intervalTime}
          </Text>
        </View>
      </View>
    );
  }

  renderItem = (item, index) => {
    return (
      <View style={[styles.touchableItem, { backgroundColor: index%2===0 ? '#e7e7e7' : 'white' }]}>
        <View style={styles.viewItem}>
          <View style={styles.viewRow}>
            <Text style={styles.textExercizeName}>
              {item.Exercise.name}
            </Text>
            <MKCheckbox
              style={{width: 24, height: 24}}
              borderOffColor={'rgba(0,0,0,.54)'}
              fillColor={MKColor.Blue}
              borderOnColor={MKColor.Blue}
              checked={this.props.check.get(index)}
              onCheckedChange={() => { this.checkExsercise(index) }}
            />
          </View>
          <View style={styles.viewSets}>
            <View style={styles.viewSetsFlex}>
              <View style={styles.viewSetHead}>
                <Text style={styles.textSets}>
                  Weight
                </Text>
              </View>
              <View style={styles.viewSetHead}>
                <Text style={styles.textSets}>
                  Reps
                </Text>
              </View>
              <View style={styles.viewSetHead}>
                <Text style={styles.textSets}>
                  Time
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.viewSetsArray}>
            {/* {item.sets.map(set => {this.renderRow(set)})} */}
            {liveWorkoutComponents[index].sets
              .map(set => { return(this.renderRow(set)); })}
          </View>
        </View>
      </View>
    );
  }

  render() {
    const { workOut, PRE, timeDate, focus, nextWorkoutTree, currentTimerValue } = this.props;
    const workoutName = this.props.nextWorkoutTree.workoutName;
    const intensityScore = this.props.nextWorkoutTree.intensityScore;
    const workoutDate = moment(this.props.nextWorkoutTree.workoutDate).format('MM/DD/YYYY');

    return (
      <View style={styles.viewContainer}>
        <ScrollView style={styles.container}>
          <View style={styles.viewHead}>
          {
            // <View style={styles.viewHeadItem}>
            //   <Text style={styles.textTop}>
            //     Workout Name:
            //   </Text>
            // </View>
          }
            <View style={styles.viewHeadItem}>
              <Text style={styles.textTop}>
                Date: {workoutDate}
              </Text>
            </View>
            <View style={styles.viewHeadItem}>
              <Text style={styles.textTop}>
                Intensity Score: {intensityScore}
              </Text>
            </View>
            <View style={styles.viewHeadItem}>
              <Text onPress={() => { this.props.dispatch(NavigationState.popRoute()); }} style={styles.textTop}>
                Focus: {nextWorkoutTree.goal}
              </Text>
            </View>
          </View>
          <View style={styles.viewTouchOpacityComplete}>
          {this.renderComleteWorkoutButton()}
          </View>
          <View style={styles.viewItems}>
            {
              nextWorkoutTree.liveWorkoutComponents
              ?
                Array.isArray(nextWorkoutTree.liveWorkoutComponents) &&
                nextWorkoutTree.liveWorkoutComponents.map((item, index) => {
                  return(this.renderItem(item, index));
                })
              :
                <View style={styles.activityIndicator}>
                  <ActivityIndicator color={'#7b7b7b'} size={Platform.OS === 'android' ? 25 : "large"} />
                </View>
            }
          </View>
        </ScrollView>
        <LiveWorkoutFinishWindow
          currentTimerValue={currentTimerValue}
          windowFinishVisible={this.state.windowFinishVisible}
          setWindowFinishVisible={() => {this.setWindowFinishVisible()}}
          beginWorkoutTime={this.state.beginWorkoutTime}
          athleteId={this.props.athleteId}
          nextWorkoutTree={this.props.nextWorkoutTree}
          nextWorkoutToken={this.props.nextWorkoutToken}
          popToStartScreen={(requestCheck) => {this.pop(requestCheck)}}
          clearCheck={() => {this.clearCheck()}}
        />
        <NavButton />
      </View>
    );
  }
}

LiveWorkout.propTypes = {
  workOut: PropTypes.string,
  PRE: PropTypes.string,
  timeDate: PropTypes.string,
  focus: PropTypes.number,
  nextWorkoutTree: PropTypes.object,
};

export default LiveWorkout;