<?xml version="1.0" encoding="utf-8" ?>
<file>
<properties><descriptions><description><value>admin</value><key>author</key></description><description><value>24/11/2016 21:28:22</value><key>creation date</key></description><description><value>Just a basic sample.</value><key>summary</key></description><description><value>None.</value><key>prerequisites</key></description><description><value><comments /></value><key>comments</key></description><description><value>myplugins</value><key>libraries</key></description><description><value>myplugins</value><key>adapters</key></description><description><value>Writing</value><key>state</key></description><description><value>REQ_01</value><key>requirement</key></description></descriptions><inputs-parameters><parameter><color>#FBFBFB</color><value>False</value><name>DEBUG</name><description /><type>bool</type><scope>local</scope></parameter><parameter><name>SSH_COMMAND</name><type>text</type><description /><value>systemctl status httpd</value><color /><scope>local</scope></parameter><parameter><name>SVR</name><type>json</type><description /><value>{
	"SSH_HOST": "10.0.0.240",
	"SSH_PORT": 22,
	"SSH_LOGIN": "root",
	"SSH_PWD": "bonjour"
}</value><color /><scope>cache</scope></parameter><parameter><name>TEXT_EXPECTED_SCREEN</name><type>text</type><description /><value>.*active \(running\).*</value><color /><scope>local</scope></parameter><parameter><color /><value>20.0</value><name>TIMEOUT</name><description /><type>float</type><scope>local</scope></parameter><parameter><color /><value>True</value><name>VERBOSE</name><description /><type>bool</type><scope>local</scope></parameter></inputs-parameters><agents /><probes><probe><active>False</active><args /><name>probe01</name><type>default</type></probe></probes><outputs-parameters><parameter><color /><value>1.0</value><name>TIMEOUT</name><description /><type>float</type><scope>local</scope></parameter></outputs-parameters></properties>
<testdefinition><![CDATA[
class CLI_SSH_01(TestCase):
	def description(self):
		# steps description
		self.step1 = self.addStep(expected="command executed", 
																				description="run ssh command", 
																				summary="run ssh command", 
																				enabled=True)
	def prepare(self):
		self.step1.start()
		
#		self.info( "%s" % Cache().get(name="SVR_SSH_HOST"))
		self.ADP_SYS = SutAdapters.CLI.SshTerminal(
																																parent=self, 
																																destIp=Cache().get(name="SVR_SSH_HOST"),
																																destPort=Cache().get(name="SVR_SSH_PORT"),
																																login=Cache().get(name="SVR_SSH_LOGIN"),
																																password=Cache().get(name="SVR_SSH_PWD"),
																																agent=None,
																																agentSupport=False,
																																debug=input('DEBUG'), 
																																verbose=input('VERBOSE'))

	def definition(self):
		if not self.ADP_SYS.doSession(timeout=input('TIMEOUT')):
			self.step1.setFailed(actual="unable to connect")
			self.abort("unable to connect")
			
		self.ADP_SYS.doText(text=input('SSH_COMMAND'))
		screen =  self.ADP_SYS.hasReceivedScreen(timeout=input('TIMEOUT'), text=TestOperators.RegEx(needle=input('TEXT_EXPECTED_SCREEN')))
		if screen is None:
			self.step1.setFailed("unable to find %s in screen" % input('SSH_COMMAND'))
			self.abort("unable to find %s in screen" % input('SSH_COMMAND'))
		else:
			Cache().capture(data=screen.get("TERM", "data"), regexp=input('SSH_COMMAND'))
			self.step1.setPassed("%s found in scren" % input('SSH_COMMAND'))

		self.step1.setPassed(actual="command executed on the remote host")


	def cleanup(self, aborted):
		if aborted:
			Trace(self).error(txt="%s" % aborted, bold=False, italic=False, multiline=False, raw=False)
]]></testdefinition>
<testexecution><![CDATA[
CLI_SSH_01().execute()]]></testexecution>
<testdevelopment>1480019302.962758</testdevelopment>
</file>