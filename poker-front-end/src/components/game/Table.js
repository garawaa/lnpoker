import React, { Component } from "react";
import Board from "./Board";
import Opponents from "./Opponents";
import Player from "./Player";
import { connect } from "react-redux";
import * as actions from "../../actions/gameActions";
import { getIsFetching } from "../../reducers";
import PropTypes from "prop-types";
import { Prompt } from "react-router-dom";

// socket
import io from "socket.io-client";

class Table extends Component {
  constructor(props) {
    super(props);

    this.state = {
      socket: io("http://localhost:8010/game"),
      roundmessage: {}
    };
  }

  componentDidMount() {
    // Set state of game when table is mounted
    console.log("mounted");
    this.props.fetchGameData();

    this.state.socket.on("connect", () => {
      this.state.socket.emit("room", this.props.game.id, this.props.user.id);
      console.log("emitted room info", this.props.game.id, this.props.user.id);
    });

    this.state.socket.on("round message", msg =>
      this.setState({ roundmessage: msg })
    );

    this.state.socket.on("table updated", () => {
      console.log("table updated");
      this.props.fetchGameData();
      this.setState({ roundmessage: {} });
    });

    // window.onbeforeunload = confirmExit;
    // function confirmExit() {
    //   return "You have attempted to leave this page. Are you sure?";
    // }
  }

  componentWillUnmount() {
    // remove player from state when leaving table
    // this.props.exitGame();
    this.state.socket.disconnect();
  }
  render() {
    console.log("rendered");

    const { user } = this.props;
    const { players, isFetching, roundname, ...rest } = this.props.game;

    // bool to decide whether to show buttons
    const disabledstate =
      roundname === "Showdown" ||
      this.state.roundmessage.winner ||
      this.state.roundmessage.bankrupt;

    // loading indicator
    if (isFetching || !rest.smallblind) {
      return <p> Loading </p>;
    }

    // filter out my info from players to get opponents info
    const opponents = players.filter(player => player.username !== user.name);
    // filter out opponents info from players to get my info
    const myInfo = players.find(player => player.username === user.name);

    return (
      <div className="container table-container">
        <Prompt
          message={location =>
            `Leaving a game might lead to loss of blinds and bets placed. Are you sure?`
          }
        />
        <Opponents opponents={opponents} disabledstate={disabledstate} />

        <Board {...rest} roundMessage={this.state.roundmessage} />

        <Player myInfo={myInfo} disabledstate={disabledstate} />
      </div>
    );
  }
}

Table.propTypes = {
  fetchGameData: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  game: state.game,
  isFetching: getIsFetching(state),
  user: {
    id: state.auth.user.id,
    name: state.auth.user.username
  }
});

export default connect(
  mapStateToProps,
  actions
)(Table);
