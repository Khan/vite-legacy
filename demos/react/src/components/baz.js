import * as React from "react";
import Button from "@khanacademy/wonder-blocks-button";

export default class Baz extends React.Component {
    render() {
        const {children, ...otherProps} = this.props;
        return <Button {...otherProps}>
            {children}
        </Button>;
    }
}
