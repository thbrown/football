import { Button, Slider } from "@blueprintjs/core";
import React from "react";
import { Clock } from "../clock";

interface Props {
    clock: Clock;
}

export const Track: React.FC<Props> = ({clock}) => {
    const [isPlaying, setIsPlaying] = React.useState(false);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    }

    const maxTime = clock.getMaxTime();
    //const labelStepSize = maxTime <= 0 ? 1 : maxTime / 10;
    
    return (
        <div className="track-wrapper">
            <Button className="track-button" icon={isPlaying ? "pause" : "play"} onClick={togglePlay} ></Button>
            <Slider className="track-slider" labelStepSize={1} stepSize={.01} value={clock.getElapsedTime()/1000} /*labelStepSize={labelStepSize}*/ onChange={(v) => clock.gotoTime(v*1000)} min={0} max={maxTime/1000}/>
        </div>
    );
};
    