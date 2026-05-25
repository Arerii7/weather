#!/usr/bin/env bash
weather Tokyo -t nord -d 2
sleep 1.5
clear
weather Tokyo -t mint -d 2
sleep 1.5
clear
weather Tokyo -t daybreak -d 2
sleep 1.5
clear
weather Tokyo -t midnight -d 2
sleep 1.5
clear
weather Tokyo -t monochrome -d 2
sleep 1.5
clear
echo "weather Tokyo -j | jq '.current.temperature'"
weather Tokyo -j | python3 -m json.tool | head -15
sleep 2
clear
weather London --hide-icon -d 1
sleep 2
clear
weather Tokyo -f 3
