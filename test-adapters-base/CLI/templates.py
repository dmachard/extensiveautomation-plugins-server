#!/usr/bin/env python
# -*- coding=utf-8 -*-

# ------------------------------------------------------------------
# Copyright (c) 2010-2019 Denis Machard
# This file is part of the extensive automation project
#
# This library is free software; you can redistribute it and/or
# modify it under the terms of the GNU Lesser General Public
# License as published by the Free Software Foundation; either
# version 2.1 of the License, or (at your option) any later version.
#
# This library is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public
# License along with this library; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
# MA 02110-1301 USA
# -------------------------------------------------------------------

import TestExecutorLib.TestValidatorsLib as TestValidatorsLib
import TestExecutorLib.TestTemplatesLib as TestTemplatesLib
import TestExecutorLib.TestOperatorsLib as TestOperatorsLib
import TestExecutorLib.TestAdapterLib as TestAdapterLib

import sys

def ssh(host=None, port=None, more=None):
	"""
	Construct a SSH template
	"""
	layer_ssh = TestTemplatesLib.TemplateLayer(name='SSH')
	
	# add keys
	if host is not None:
		layer_ssh.addKey(name='destination-host', data=host )
	if port is not None:
		layer_ssh.addKey(name='destination-port', data=port )
		
	# add additional keys
	if more is not None:
		layer_ssh.addMore(more=more)
	
	return layer_ssh

def open_channel():
	"""
	Construct a template for SSH connection
	"""
	tpl = { 'ssh-event': 'open-channel' }
	return tpl	
	
def open_channel_ok():
	"""
	Construct a template for SSH connection
	"""
	tpl = { 'ssh-event': 'channel-opened' }
	return tpl	
	
def open_channel_failed():
	"""
	Construct a template for SSH connection
	"""
	tpl = { 'ssh-event': 'open-channel-failed' }
	return tpl	
	
def authentication():
	"""
	Construct a template for SSH connection
	"""
	tpl = { 'ssh-event': 'authentication' }
	return tpl	

def authentication_ok():
	"""
	Construct a template for SSH connection
	"""
	tpl = { 'ssh-event': 'authentication-ok' }
	return tpl	
	
def authentication_failed(err=None):
	"""
	Construct a template for SSH connection
	"""
	tpl = { 'ssh-event': 'authentication-failed' }
	if err is not None:
		tpl['error'] = err
	return tpl	
	
def negotiation():
	"""
	Construct a template for SSH connection
	"""
	tpl = { 'ssh-event': 'negotiation' }
	return tpl	

def negotiation_ok():
	"""
	Construct a template for SSH connection
	"""
	tpl = { 'ssh-event': 'negotiation-ok' }
	return tpl	
	
def negotiation_failed(err=None):
	"""
	Construct a template for SSH connection
	"""
	tpl = { 'ssh-event': 'negotiation-failed' }
	if err is not None:
		tpl['error'] = err
	return tpl	
	
def connection():
	"""
	Construct a template for SSH connection
	"""
	tpl = { 'ssh-event': 'connection' }
	return tpl	
	
def connected():
	"""
	Construct a template for SSH connection
	"""
	tpl = { 'ssh-event': 'connected' }
	return tpl	
	
def disconnection():
	"""
	Construct a template for SSH connection
	"""
	tpl = { 'ssh-event': 'disconnection' }
	return tpl	
	
def disconnected():
	"""
	Construct a template for SSH disconnection
	"""
	tpl = { 'ssh-event': 'disconnected' }
	return tpl	

def connected():
	"""
	Construct a template
	"""
	tpl = { 'ssh-event': 'connected' }
	return tpl

def disconnected():
	"""
	Construct a template
	"""
	tpl = { 'ssh-event': 'disconnected' }
	return tpl

def disconnected_by_server():
	"""
	Construct a template for SSH disconnection
	"""
	tpl = { 'ssh-event': 'disconnected-by-server' }
	return tpl	

def generic_error():
	"""
	Construct a template for SSH generic error
	"""
	tpl = {'ssh-event': 'generic-error'}
	return tpl	
	
def connection_refused():
	"""
	Construct a template for SSH connection refused
	"""
	tpl = { 'ssh-event': 'connection-refused' }
	return tpl	
	
def connection_reset():
	"""
	Construct a template for SSH connection reset
	"""
	tpl = { 'ssh-event': 'connection-reset' }
	return tpl	

def connection_refused():
	"""
	Construct a template for SSH on connection refused
	"""
	tpl = { 'ssh-event': 'connection-refused' }
	return tpl

def connection_timeout():
	"""
	Construct a template for SSH on connection timeout
	"""
	tpl = { 'ssh-event': 'connection-timeout' }
	return tpl

def connection_failed(errno=None, errstr=None):
	"""
	Construct a template for SSH on connection failed
	"""
	tpl = { 'ssh-event': 'connection-failed' }
	if errno is not None:
		tpl['error-no'] = errno
	if errstr is not None:
		tpl['error-str'] = errstr
	return tpl

def data_sent(data=None):
	"""
	Construct a template
	"""
	tpl = { 'ssh-event': 'data-sent'}
	if data is not None:
		tpl['data'] = data
	return tpl

def data_received(data=None):
	"""
	Construct a template
	"""
	tpl = { 'ssh-event': 'data-received'}
	if data is not None:
		tpl['data'] = data
	return tpl

def tcp(source=None, destination=None, more=None,  sum=None, 
        sum_status=None, sum_int=None,seq_num=None,  ack_num=None, 
        data=None, data_size=None, window=None, window_int=None, urgent=None, urgent_int=None,
        data_offset=None, control_bits=None, control_bits_str=None,
        options=None, options_size=None, opt_max_seg=None, opt_pad=None, 
        opt_nop=None, opt_end=None, opt_win_scale=None,
        opt_ts=None, opt_sack_permitted=None, opt_sack=None, opt_echo=None, opt_reply=None):
	"""
	Construct a template for a tcp packet
	"""
	tpl = TestTemplatesLib.TemplateLayer(name='TCP')
	
	# add keys
	if source is not None:
		tpl.addKey(name='source-port', data=str(source) )
	if destination is not None:
		tpl.addKey(name='destination-port', data=str(destination) )

	if sum is not None:
		tpl_sum = TestTemplatesLib.TemplateLayer(name=sum)
		if sum_status is not None:
			tpl_sum.addKey(name='status', data=sum_status )
		if sum_int is not None:
			tpl_sum.addKey(name='integer', data=sum_int )
		tpl.addKey(name='checksum', data=tpl_sum )
	
	if seq_num is not None:
		tpl.addKey(name='sequence-number', data=seq_num )

	if ack_num is not None:
		tpl.addKey(name='acknowledgment-number', data=ack_num )

	if window is not None:
		tpl_window = TestTemplatesLib.TemplateLayer(name=window)
		if window_int is not None:
			tpl_window.addKey(name='integer', data=window_int )
		tpl.addKey(name='window', data=tpl_window )
	
	if data_offset is not None:
		tpl_offset = TestTemplatesLib.TemplateLayer(name=data_offset)
		tpl.addKey(name='data-offset', data=tpl_offset )
	
	if urgent is not None:
		tpl_urgent = TestTemplatesLib.TemplateLayer(name=urgent)
		if urgent_int is not None:
			tpl_urgent.addKey(name='integer', data=urgent_int )
		tpl.addKey(name='urgent-pointer', data=tpl_urgent )
	
	if control_bits is not None:
		tpl_control = TestTemplatesLib.TemplateLayer(name=control_bits)
		if control_bits_str is not None:
			tpl_control.addKey(name='string', data=control_bits_str )
		tpl.addKey(name='control-bits', data=tpl_control )
	
	if options is not None:
		tpl_opts = TestTemplatesLib.TemplateLayer(name=options)
		if options_size is not None:
			tpl_opts.addKey(name='length', data=options_size ) 
		if opt_nop is not None:
			tpl_opts.addKey(name='no-operation', data=opt_nop ) 
		if opt_end is not None:
			tpl_opts.addKey(name='end-of-option-list', data=opt_end ) 
		if opt_win_scale is not None:
			tpl_opts.addKey(name='window-scale', data=opt_win_scale ) 
		if opt_max_seg is not None:
			tpl_opts.addKey(name='maximun-segment-size', data=opt_max_seg ) 
		if opt_pad is not None:
			tpl_opts.addKey(name='padding', data=opt_pad ) 
		if opt_pad is not None:
			tpl_opts.addKey(name='padding', data=opt_pad ) 
		if opt_sack_permitted is not None:
			tpl_opts.addKey(name='sack-permitted', data=opt_sack_permitted ) 
		if opt_sack is not None:
			tpl_opts.addKey(name='sack', data=opt_sack ) 
		if opt_echo is not None:
			tpl_opts.addKey(name='echo', data=opt_echo ) 
		if opt_reply is not None:
			tpl_opts.addKey(name='reply', data=opt_reply ) 
		tpl.addKey(name='options', data=tpl_opts )
		
	# set data upper
	if data is not None:
		tpl_data = TestTemplatesLib.TemplateLayer(name=data)
		if data_size is not None:
			tpl_data.addKey(name='length', data=data_size )
		tpl.addKey(name='data', data=tpl_data )

	# add additional keys
	if more is not None:
		tpl.addMore(more=more)
	
	return tpl

def tcp_received(data=None, data_length=None, id=None):
	"""
	Construct a template for TCP incoming data
	"""
	tpl = { 'tcp-event': 'received' }
	if data is not None:
		tpl['tcp-data'] = data	
	
	if data_length is not None:
		tpl['tcp-data-length'] = data_length
	
	if id is not None:
		tpl['client-id'] = str(id)	
	return tpl

def tcp_sent(data=None, data_length=None, id=None):
	"""
	Construct a template for TCP outgoing data
	"""
	tpl = { 'tcp-event': 'sent' }
	if data is not None:
		tpl['tcp-data'] = data
	
	if data_length is not None:
		tpl['tcp-data-length'] = data_length
		
	if id is not None:
		tpl['client-id'] = str(id)	
	return tpl	

def ip(   source=None, source_hex=None, destination=None, destination_hex=None,
        version=None, ihl=None, 
        tos=None, p=None, p_str=None, d=None, d_str=None, t=None, t_str=None, r=None, r_str=None,
        tl=None, id=None, 
        flg=None, flg_str=None, frg=None, ttl=None,
        pro=None, sum=None, sum_status=None, sum_int=None,
        data=None, data_size=None, more=None, pro_str=None):
	"""
	Construct a template for a ipv4 packet
	"""	
	tpl = TestTemplatesLib.TemplateLayer(name='IP4')
	
	# add keys
	if version is not None:
		tpl.addKey(name='version', data=version)
	if source is not None:
		tpl_src = TestTemplatesLib.TemplateLayer(name=source )
		if source_hex is not None:
			tpl_src.addKey(name='hex', data=source_hex )
		tpl.addKey(name='source-ip', data=tpl_src )
	if destination is not None:
		tpl_dst = TestTemplatesLib.TemplateLayer(name=destination )
		if destination_hex is not None:
			tpl_dst.addKey(name='hex', data=destination_hex )
		tpl.addKey(name='destination-ip', data=tpl_dst )
	
	# v4 fields
	if ihl is not None:
		tpl.addKey(name='header-length', data=ihl )
		
	if tos is not None:
		tpl_tos = TestTemplatesLib.TemplateLayer(name=str(tos) )
		if p is not None:
			tpl_p = TestTemplatesLib.TemplateLayer(name=str(p) )
			if p_str is not None:
				tpl_p.addKey(name='string', data=p_str )
			tpl_tos.addKey(name='precedence', data=tpl_p )
		if d is not None:
			tpl_d = TestTemplatesLib.TemplateLayer(name=str(d) )
			if d_str is not None:
				tpl_d.addKey(name='string', data=d_str )
			tpl_tos.addKey(name='delay', data=tpl_d )
		if t is not None:
			tpl_t = TestTemplatesLib.TemplateLayer(name=str(t) )
			if t_str is not None:
				tpl_t.addKey(name='string', data=t_str )
			tpl_tos.addKey(name='throughput', data=tpl_t )
		if r is not None:
			tpl_r = TestTemplatesLib.TemplateLayer(name=str(r) )
			if r_str is not None:
				tpl_r.addKey(name='string', data=r_str )
			tpl_tos.addKey(name='relibility', data=tpl_r )
		tpl.addKey(name='type-service', data=tpl_tos )	
		
	if tl is not None:
		tpl.addKey(name='total-length', data=tl )	
	if id is not None:
		tpl.addKey(name='identification', data=id )	
		
	if flg is not None:
		tpl_flg = TestTemplatesLib.TemplateLayer(name=flg )
		if flg_str is not None:
			tpl_flg.addKey(name='string', data=flg_str )
		tpl.addKey(name='flags', data=tpl_flg )	
		
	if frg is not None:
		tpl.addKey(name='fragment-offset', data=frg )	
	if ttl is not None:
		tpl.addKey(name='time-to-live', data=ttl )	
		
	if pro is not None:
		tpl_pro = TestTemplatesLib.TemplateLayer(name=str(pro) )
		if pro_str is not None:
			tpl_pro.addKey(name='string', data=pro_str )
		tpl.addKey(name='protocol', data=tpl_pro )

	if sum is not None:
		tpl_sum = TestTemplatesLib.TemplateLayer(name=sum)
		if sum_status is not None:
			tpl_sum.addKey(name='status', data=sum_status )
		if sum_int is not None:
			tpl_sum.addKey(name='integer', data=sum_int )
		tpl.addKey(name='checksum', data=tpl_sum )
		
	# set data upper
	if data is not None:
		tpl_data = TestTemplatesLib.TemplateLayer(name=data)
		if data_size is not None:
			tpl_data.addKey(name='length', data=data_size )
		tpl.addKey(name='data', data=tpl_data )
		
	# add additional keys
	if more is not None:
		tpl.addMore(more=more)
	return tpl

def ip_sent(data=None):
	"""
	Construct a template for IP outgoing packet
	"""
	tpl = { 'ip-event': 'sent' }
	if data is not None:
		tpl['ip-data'] = data
	return tpl	

def ip_received(data=None):
	"""
	Construct a template for IP incoming packet
	"""
	tpl = { 'ip-event': 'received' }
	if data is not None:
		tpl['ip-data'] = data	
	return tpl