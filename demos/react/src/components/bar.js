import * as React from "react";
import {css, StyleSheet} from "aphrodite";

export default class Bar extends React.Component {
    render() {
        return <div className={css(styles.bar)} id="bar">
            Bar!
        </div>;
    }
}

const styles = StyleSheet.create({
    bar: {
        width: 320,
        height: 200,
        fontSize: 30,
        backgroundColor: "pink",
    },
});
