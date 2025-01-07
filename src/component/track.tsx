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

    React.useEffect(() => {
        let animationFrameId: number;

        const updateClock = () => {
            const newElapsedTime = clock.getElapsedTime() + 16.67; // 60fps
            if(newElapsedTime >= clock.getMaxTime()) {
                clock.stop();
                clock.gotoTime(clock.getMaxTime());
                setIsPlaying(false);
            }
            clock.gotoTime(newElapsedTime);
            animationFrameId = requestAnimationFrame(updateClock);
        };

        if (isPlaying) {
            animationFrameId = requestAnimationFrame(updateClock);
        } else {
            cancelAnimationFrame(animationFrameId);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying, clock]);

    const maxTime = clock.getMaxTime();
    
    return (
        <div className="track-wrapper">
            <Button className="track-button" icon={isPlaying ? "pause" : "play"} onClick={togglePlay} ></Button>
            <Slider className="track-slider" labelStepSize={1} stepSize={.01} value={clock.getElapsedTime()/1000} onChange={(v) => clock.gotoTime(v*1000)} min={0} max={maxTime/1000}/>
        </div>
    );
};