#!/bin/sh

# Deletes PID file before exit:
function remove_pid() {
	trap - INT TERM EXIT
	rm -f $0.pid
}

# Check if no instance of this script is running already:
PID=`cat $0.pid 2>/dev/null`
if [ -z "$PID" ] || ! kill -0 $PID 2>/dev/null; then
	echo $$ > $0.pid
	trap 'remove_pid' INT TERM EXIT
else
	echo "Already running...";
	exit;
fi

# Check for changes:
CHANGES=`svn diff -r BASE:HEAD .objdump | wc -l`
[ $CHANGES = 0 ] && exit

# Update checkout directory:
svn update .objdump

# Export new site:
rm -rf objdump.new
svn export  https://free2.projectlocker.com/spektom/objdump/svn/trunk objdump.new
[ $? = 0 ] || exit

# Replace site
mv objdump objdump.old
mv objdump.new objdump
rm -rf objdump.old

monit restart objdump

