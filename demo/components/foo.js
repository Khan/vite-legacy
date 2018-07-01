import * as React from "react";
import {css, StyleSheet} from "aphrodite";

export default class Foo extends React.Component {
    render() {
        return <div className={css(styles.foo)} id="foo">
            Foo!
        </div>;
    }
}

const styles = StyleSheet.create({
    foo: {
        width: 320,
        height: 200,
        fontSize: 30,
        backgroundColor: "orange",
    },
});
