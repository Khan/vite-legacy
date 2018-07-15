import * as React from "react";
import * as ReactDOM from "react-dom";
import {StyleSheet, css} from "aphrodite";

const container = document.createElement("div");
document.body.appendChild(container);

const styles = StyleSheet.create({
    foo: {
        backgroundColor: "pink",
    },
});

ReactDOM.render(<h1 className={css(styles.foo)}>Hello, world</h1>, container);
