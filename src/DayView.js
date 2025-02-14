// @flow
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import populateEvents from './Packer';
import React from 'react';
import moment from 'moment';
import _ from 'lodash';
import Dash from 'react-native-dash';

const LEFT_MARGIN = 50 - 1;
const RIGHT_MARGIN = 20;
const CALENDER_HEIGHT = 2400;
// const EVENT_TITLE_HEIGHT = 15
const TEXT_LINE_HEIGHT = 17;
// const MIN_EVENT_TITLE_WIDTH = 20
// const EVENT_PADDING_LEFT = 4

function range(from, to) {
  return Array.from(Array(to), (_, i) => from + i);
}

export default class DayView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.calendarHeight = (props.end - props.start) * (props.hourHeight || 100);
    const width = props.width - LEFT_MARGIN - RIGHT_MARGIN;
    const packedEvents = populateEvents(props.events, width, props.start, (props.hourHeight || 100));
    let initPosition =
      _.min(_.map(packedEvents, 'top')) -
      this.calendarHeight / (props.end - props.start);
    initPosition = initPosition < 0 ? 0 : initPosition;
    this.state = {
      _scrollY: initPosition,
      packedEvents,
    };
  }

  componentWillReceiveProps(nextProps) {
    const width = nextProps.width - LEFT_MARGIN - RIGHT_MARGIN;
    this.calendarHeight = (nextProps.end - nextProps.start) * (nextProps.hourHeight || 100);

    this.setState({
      packedEvents: populateEvents(nextProps.events, width, nextProps.start, (this.props.hourHeight || 100)),
    });
  }

  componentDidMount() {
    this.props.scrollToFirst && this.scrollToFirst();
  }

  scrollToFirst() {
    setTimeout(() => {
      if (this.state && this.state._scrollY && this._scrollView) {
        this._scrollView.scrollTo({
          x: 0,
          y: this.state._scrollY,
          animated: true,
        });
      }
    }, 1);
  }

  _renderRedLine() {
    const offset = this.props.hourHeight || 100;
    const { width, styles, date } = this.props;
    const timeNowHour = moment().hour();
    const timeNowMin = moment().minutes();
    if (!date.isSame(moment(), 'day')) {
      return null;
    }
    return (
      <View
        key={`timeNow`}
        style={[
          styles.lineNow,
          {
            top:
              offset * (timeNowHour - this.props.start) +
              (offset * timeNowMin) / 60,
            width: width - 20,
          },
        ]}
      />
    );
  }

  _renderLines() {
    const { format24h, start, end } = this.props;
    const offset = this.calendarHeight / (end - start);

    return range(start, end + 1).map((i, index) => {
      let timeText;
      if (i === 0) {
        timeText = !format24h ? `12 AM` : `0:00`;
      } else if (i < 12) {
        timeText = !format24h ? `${i} AM` : `${i}:00`;
      } else if (i === 12) {
        timeText = !format24h ? `${i} PM` : `${i}:00`;
      } else if (i === 24) {
        timeText = !format24h ? `12 AM` : `0:00`;
      } else {
        timeText = !format24h ? `${i - 12} PM` : `${i}:00`;
      }
      const { width, styles, lineHalf } = this.props;
      const array = [
        <Text
          key={`timeLabel${i}`}
          style={[styles.timeLabel, { top: offset * index - 6 }]}
        >
          {timeText}
        </Text>,
        i === start ? null : (
          <Dash
            key={`line${i}`}
            dashThickness={1}
            dashColor={'#CCCCCC'}
            style={[styles.line, { top: offset * index, width: width - 20 }]}
          />
        ),
      ];

      if (lineHalf) {
        array.push(
          <Dash
            key={`lineHalf${i}`}
            dashThickness={1}
            dashColor={'#CCCCCC'}
            style={[
              styles.line,
              { top: offset * (index + 0.5), width: width - 20 },
            ]}
          />
        );
      }
      return array;
    });
  }

  _renderTimeLabels() {
    const { styles, start, end } = this.props;
    const offset = this.calendarHeight / (end - start);
    return range(start, end).map((item, i) => {
      return (
        <View key={`line${i}`} style={[styles.line, { top: offset * i }]} />
      );
    });
  }

  _onEventTapped(event) {
    this.props.eventTapped(event);
  }

  _renderEvents() {
    const { styles } = this.props;
    const { packedEvents } = this.state;
    let events = packedEvents.map((event, i) => {
      const style = {
        left: event.left,
        height: event.height,
        width: event.width,
        top: event.top,
      };

      const eventColor = {
        backgroundColor: event.color,
      };

      // Fixing the number of lines for the event title makes this calculation easier.
      // However it would make sense to overflow the title to a new line if needed
      const numberOfLines = Math.floor(event.height / TEXT_LINE_HEIGHT);
      const formatTime = this.props.format24h ? 'HH:mm' : 'hh:mm A';
      return (
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => this._onEventTapped(this.props.events[event.index])}
          key={i}
          style={[styles.event, style, event.color && eventColor]}
        >
          {this.props.renderEvent ? (
            this.props.renderEvent(event)
          ) : (
              <View>
                <Text numberOfLines={1} style={styles.eventTitle}>
                  {event.title || 'Event'}
                </Text>
                {numberOfLines > 1 ? (
                  <Text
                    numberOfLines={numberOfLines - 1}
                    style={[styles.eventSummary]}
                  >
                    {event.summary || ' '}
                  </Text>
                ) : null}
                {numberOfLines > 2 ? (
                  <Text style={styles.eventTimes} numberOfLines={1}>
                    {moment(event.start).format(formatTime)} -{' '}
                    {moment(event.end).format(formatTime)}
                  </Text>
                ) : null}
              </View>
            )}
        </TouchableOpacity>
      );
    });

    return (
      <View>
        <View style={{ marginLeft: LEFT_MARGIN }}>{events}</View>
      </View>
    );
  }

  render() {
    const { styles } = this.props;
    return (
      <ScrollView
        ref={ref => (this._scrollView = ref)}
        contentContainerStyle={[
          styles.contentStyle,
          { width: this.props.width },
        ]}
      >
        {this._renderLines()}
        {this._renderEvents()}
        {this._renderRedLine()}
      </ScrollView>
    );
  }
}
