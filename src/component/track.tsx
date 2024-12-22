import { Button, Slider } from "@blueprintjs/core";
import React from "react";

export const Track = () => {
    const [isPlaying, setIsPlaying] = React.useState(false);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    }

    return (
        <div className="track-wrapper">
            <Button className="track-button" icon={isPlaying ? "pause" : "play"} onClick={togglePlay}></Button>
            <Slider className="track-slider"/>
        </div>
    );
};
    